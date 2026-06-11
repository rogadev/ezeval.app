import { describe, it, expect } from 'vitest';
import {
	computeEvaluation,
	computeTaxes,
	formatTaxRate,
	redactForViewer,
	formatCents
} from './engine';
import type { EvaluationInputItem, SheetPricingConfig } from './engine';

const baseSheet: SheetPricingConfig = {
	setupFeeEnabled: false,
	setupFeeCents: 0,
	minimumCents: 0,
	estimatorVisibility: 'grand_total'
};

const flat = (
	unitPriceCents: number,
	quantity: number,
	labels: Partial<EvaluationInputItem> = {}
): EvaluationInputItem => ({
	rowLabel: 'Ground Level',
	buttonLabel: 'Small',
	pricingUnit: 'flat',
	unitPriceCents,
	quantity,
	...labels
});

describe('computeEvaluation', () => {
	it('multiplies unit price by quantity per line', () => {
		const result = computeEvaluation(baseSheet, [flat(300, 3)]);
		expect(result.items[0].lineTotalCents).toBe(900);
		expect(result.subtotalCents).toBe(900);
		expect(result.totalCents).toBe(900);
	});

	it('sums multiple lines and counts units', () => {
		const result = computeEvaluation(baseSheet, [
			flat(300, 3),
			flat(550, 2, { buttonLabel: 'Large' }),
			{
				rowLabel: 'Special',
				buttonLabel: 'French',
				pricingUnit: 'per_unit',
				unitPriceCents: 100,
				quantity: 14
			}
		]);
		expect(result.subtotalCents).toBe(900 + 1100 + 1400);
		expect(result.unitCount).toBe(19);
	});

	it('prices per-unit items by count (French panes at $1/pane)', () => {
		const result = computeEvaluation(baseSheet, [
			{
				rowLabel: 'Special',
				buttonLabel: 'French',
				pricingUnit: 'per_unit',
				unitPriceCents: 100,
				quantity: 14
			}
		]);
		expect(result.items[0].lineTotalCents).toBe(1400);
	});

	it('auto-attaches the setup fee when enabled, without a setup line item', () => {
		const sheet = { ...baseSheet, setupFeeEnabled: true, setupFeeCents: 2250 };
		const result = computeEvaluation(sheet, [flat(300, 2)]);
		expect(result.setupFeeCents).toBe(2250);
		expect(result.subtotalCents).toBe(600 + 2250);
		expect(result.totalCents).toBe(2850);
	});

	it('does not attach the setup fee when disabled even if an amount is configured', () => {
		const sheet = { ...baseSheet, setupFeeEnabled: false, setupFeeCents: 2250 };
		const result = computeEvaluation(sheet, [flat(300, 2)]);
		expect(result.setupFeeCents).toBe(0);
		expect(result.totalCents).toBe(600);
	});

	it('applies the setup fee to an evaluation with no items', () => {
		const sheet = { ...baseSheet, setupFeeEnabled: true, setupFeeCents: 2250 };
		const result = computeEvaluation(sheet, []);
		expect(result.subtotalCents).toBe(2250);
		expect(result.totalCents).toBe(2250);
	});

	it('floors the total at the sheet minimum (spec: $12 tap shows $150)', () => {
		const sheet = { ...baseSheet, minimumCents: 15000 };
		const result = computeEvaluation(sheet, [flat(1200, 1)]);
		expect(result.subtotalCents).toBe(1200);
		expect(result.totalCents).toBe(15000);
		expect(result.minimumApplied).toBe(true);
	});

	it('does not apply the minimum once the subtotal exceeds it', () => {
		const sheet = { ...baseSheet, minimumCents: 15000 };
		const result = computeEvaluation(sheet, [flat(1200, 20)]);
		expect(result.totalCents).toBe(24000);
		expect(result.minimumApplied).toBe(false);
	});

	it('counts the setup fee toward reaching the minimum', () => {
		const sheet = {
			...baseSheet,
			setupFeeEnabled: true,
			setupFeeCents: 2250,
			minimumCents: 3000
		};
		const result = computeEvaluation(sheet, [flat(300, 3)]);
		// 900 + 2250 = 3150 >= 3000
		expect(result.totalCents).toBe(3150);
		expect(result.minimumApplied).toBe(false);
	});

	it('drops zero-quantity lines', () => {
		const result = computeEvaluation(baseSheet, [flat(300, 0), flat(550, 1)]);
		expect(result.items).toHaveLength(1);
		expect(result.totalCents).toBe(550);
	});

	it('rejects negative quantities and prices', () => {
		expect(() => computeEvaluation(baseSheet, [flat(300, -1)])).toThrow(RangeError);
		expect(() => computeEvaluation(baseSheet, [flat(-300, 1)])).toThrow(RangeError);
	});

	it('rejects non-integer cent amounts and quantities', () => {
		expect(() => computeEvaluation(baseSheet, [flat(300.5, 1)])).toThrow(RangeError);
		expect(() => computeEvaluation(baseSheet, [flat(300, 1.5)])).toThrow(RangeError);
	});
});

describe('redactForViewer', () => {
	const sheet = { ...baseSheet, setupFeeEnabled: true, setupFeeCents: 2250, minimumCents: 15000 };
	const computed = computeEvaluation(sheet, [
		flat(1200, 1, { rowLabel: 'High Level', buttonLabel: 'Large' })
	]);

	it('gives admins full pricing regardless of sheet visibility', () => {
		for (const visibility of ['metrics_only', 'grand_total'] as const) {
			const view = redactForViewer(computed, 'admin', visibility);
			expect(view.priceVisibility).toBe('full');
			expect(view.totalCents).toBe(15000);
			expect(view.subtotalCents).toBe(3450);
			expect(view.setupFeeCents).toBe(2250);
			expect(view.minimumApplied).toBe(true);
			expect(view.items[0].unitPriceCents).toBe(1200);
			expect(view.items[0].lineTotalCents).toBe(1200);
		}
	});

	it('grand-total mode: estimator sees only the floored total — no per-item prices', () => {
		const view = redactForViewer(computed, 'estimator', 'grand_total');
		expect(view.priceVisibility).toBe('total_only');
		expect(view.totalCents).toBe(15000);
		// no per-item or component dollar data
		expect(view.subtotalCents).toBeUndefined();
		expect(view.setupFeeCents).toBeUndefined();
		expect(view.minimumApplied).toBeUndefined();
		expect(view.items[0]).not.toHaveProperty('unitPriceCents');
		expect(view.items[0]).not.toHaveProperty('lineTotalCents');
	});

	it('metrics-only mode: no dollar amounts anywhere in the estimator view', () => {
		const view = redactForViewer(computed, 'estimator', 'metrics_only');
		expect(view.priceVisibility).toBe('none');
		expect(view.totalCents).toBeUndefined();
		expect(view.subtotalCents).toBeUndefined();
		expect(view.setupFeeCents).toBeUndefined();
		expect(view.minimumApplied).toBeUndefined();
		for (const item of view.items) {
			expect(item).not.toHaveProperty('unitPriceCents');
			expect(item).not.toHaveProperty('lineTotalCents');
		}
		// the metrics capture itself is intact
		expect(view.items[0].rowLabel).toBe('High Level');
		expect(view.items[0].buttonLabel).toBe('Large');
		expect(view.items[0].quantity).toBe(1);
		expect(view.unitCount).toBe(1);
	});

	it('treats technicians like estimators', () => {
		expect(redactForViewer(computed, 'technician', 'metrics_only').priceVisibility).toBe('none');
		expect(redactForViewer(computed, 'technician', 'grand_total').priceVisibility).toBe(
			'total_only'
		);
	});

	it('formats cents as US dollars', () => {
		expect(formatCents(15000)).toBe('$150.00');
		expect(formatCents(125)).toBe('$1.25');
		expect(formatCents(0)).toBe('$0.00');
		expect(formatCents(123456789)).toBe('$1,234,567.89');
	});

	it('serializes without leaking redacted values (defense for JSON payloads)', () => {
		const json = JSON.stringify(redactForViewer(computed, 'estimator', 'metrics_only'));
		expect(json).not.toContain('1200');
		expect(json).not.toContain('15000');
		expect(json).not.toContain('2250');
	});
});

describe('computeTaxes', () => {
	it('computes a single GST line (5% of $150 = $7.50)', () => {
		const result = computeTaxes(15000, [{ name: 'GST', rateMilliPct: 5000 }]);
		expect(result.taxes).toEqual([{ name: 'GST', rateMilliPct: 5000, amountCents: 750 }]);
		expect(result.taxTotalCents).toBe(750);
		expect(result.totalWithTaxCents).toBe(15750);
	});

	it('applies multiple taxes in parallel, not compounded (GST 5% + PST 7%)', () => {
		const result = computeTaxes(10000, [
			{ name: 'GST', rateMilliPct: 5000 },
			{ name: 'PST', rateMilliPct: 7000 }
		]);
		expect(result.taxes[0].amountCents).toBe(500);
		expect(result.taxes[1].amountCents).toBe(700); // 7% of base, not of base+GST
		expect(result.totalWithTaxCents).toBe(11200);
	});

	it('handles three-decimal rates with half-up rounding (QST 9.975% of $100)', () => {
		const result = computeTaxes(10000, [{ name: 'QST', rateMilliPct: 9975 }]);
		expect(result.taxes[0].amountCents).toBe(998); // 997.5 rounds up
	});

	it('returns no lines and an unchanged total with an empty profile', () => {
		const result = computeTaxes(15000, []);
		expect(result.taxes).toEqual([]);
		expect(result.taxTotalCents).toBe(0);
		expect(result.totalWithTaxCents).toBe(15000);
	});

	it('rejects negative or non-integer inputs', () => {
		expect(() => computeTaxes(-1, [])).toThrow(RangeError);
		expect(() => computeTaxes(100, [{ name: 'GST', rateMilliPct: -5 }])).toThrow(RangeError);
		expect(() => computeTaxes(100, [{ name: 'GST', rateMilliPct: 50.5 }])).toThrow(RangeError);
	});

	it('formats milli-percent rates for display', () => {
		expect(formatTaxRate(5000)).toBe('5%');
		expect(formatTaxRate(9975)).toBe('9.975%');
		expect(formatTaxRate(13000)).toBe('13%');
	});
});
