import { describe, expect, it } from 'vitest';
import { SAMPLE_COUNTS, SAMPLE_SHEET } from './sample-sheet';

const buttons = SAMPLE_SHEET.rows.flatMap((row) => row.buttons);

describe('SAMPLE_SHEET', () => {
	it('gives every button a unique id', () => {
		const ids = buttons.map((b) => b.id);
		expect(new Set(ids).size).toBe(ids.length);
	});

	it('prices every amount in whole, non-negative cents', () => {
		const amounts = [
			SAMPLE_SHEET.setupFeeCents,
			SAMPLE_SHEET.minimumCents,
			...buttons.map((b) => b.priceCents)
		];
		for (const cents of amounts) {
			expect(Number.isInteger(cents)).toBe(true);
			expect(cents).toBeGreaterThanOrEqual(0);
		}
	});

	it('keeps the founder reference prices the starter sheet is provisioned with', () => {
		expect(SAMPLE_SHEET.setupFeeEnabled).toBe(true);
		expect(SAMPLE_SHEET.setupFeeCents).toBe(2250);
		expect(SAMPLE_SHEET.minimumCents).toBe(15000);
		expect(
			SAMPLE_SHEET.rows.map((row) => [row.label, row.buttons.map((b) => b.priceCents)])
		).toEqual([
			['Special', [1800, 100]],
			['High level', [500, 600, 700]],
			['Mid level', [400, 500, 600]],
			['Ground level', [300, 400, 550]]
		]);
	});
});

describe('SAMPLE_COUNTS', () => {
	it('only counts buttons that exist on the sample sheet', () => {
		const ids = new Set(buttons.map((b) => b.id));
		for (const id of Object.keys(SAMPLE_COUNTS)) {
			expect(ids.has(id)).toBe(true);
		}
	});

	it('uses positive whole quantities', () => {
		for (const quantity of Object.values(SAMPLE_COUNTS)) {
			expect(Number.isInteger(quantity)).toBe(true);
			expect(quantity).toBeGreaterThan(0);
		}
	});
});
