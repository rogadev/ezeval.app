/**
 * Pure pricing engine (spec §4.5). All amounts are integer cents.
 *
 * The server is the only place evaluations are priced: client UIs send
 * metrics (button taps + quantities), the server computes with the sheet's
 * config and redacts the result for the viewer's role before it ever leaves
 * the process. Redaction deletes fields rather than nulling them so a
 * serialized payload contains no trace of hidden dollar values.
 */

export type Role = 'admin' | 'estimator' | 'technician';
export type EstimatorVisibility = 'metrics_only' | 'grand_total';
export type PricingUnit = 'flat' | 'per_unit';

export interface SheetPricingConfig {
	setupFeeEnabled: boolean;
	setupFeeCents: number;
	minimumCents: number;
	estimatorVisibility: EstimatorVisibility;
}

export interface EvaluationInputItem {
	rowLabel: string;
	buttonLabel: string;
	pricingUnit: PricingUnit;
	unitPriceCents: number;
	quantity: number;
}

export interface ComputedLine extends EvaluationInputItem {
	lineTotalCents: number;
}

export interface ComputedEvaluation {
	items: ComputedLine[];
	/** 0 unless the sheet auto-attaches a setup fee (spec §4.4). */
	setupFeeCents: number;
	/** Line totals + setup fee. */
	subtotalCents: number;
	/** True when the minimum floor overrode the subtotal. */
	minimumApplied: boolean;
	totalCents: number;
	/** Total count of panes/items across all lines. */
	unitCount: number;
}

export interface RedactedItem {
	rowLabel: string;
	buttonLabel: string;
	pricingUnit: PricingUnit;
	quantity: number;
	unitPriceCents?: number;
	lineTotalCents?: number;
}

export interface RedactedEvaluation {
	priceVisibility: 'full' | 'total_only' | 'none';
	items: RedactedItem[];
	unitCount: number;
	setupFeeCents?: number;
	subtotalCents?: number;
	minimumApplied?: boolean;
	totalCents?: number;
}

function assertNonNegativeInt(value: number, label: string): void {
	if (!Number.isInteger(value) || value < 0) {
		throw new RangeError(`${label} must be a non-negative integer, got ${value}`);
	}
}

export function computeEvaluation(
	sheet: SheetPricingConfig,
	inputs: EvaluationInputItem[]
): ComputedEvaluation {
	assertNonNegativeInt(sheet.setupFeeCents, 'setupFeeCents');
	assertNonNegativeInt(sheet.minimumCents, 'minimumCents');

	const items: ComputedLine[] = [];
	let unitCount = 0;
	let lineSum = 0;

	for (const input of inputs) {
		assertNonNegativeInt(input.unitPriceCents, 'unitPriceCents');
		assertNonNegativeInt(input.quantity, 'quantity');
		if (input.quantity === 0) continue;

		const lineTotalCents = input.unitPriceCents * input.quantity;
		items.push({ ...input, lineTotalCents });
		unitCount += input.quantity;
		lineSum += lineTotalCents;
	}

	const setupFeeCents = sheet.setupFeeEnabled ? sheet.setupFeeCents : 0;
	const subtotalCents = lineSum + setupFeeCents;
	const minimumApplied = sheet.minimumCents > 0 && subtotalCents < sheet.minimumCents;
	const totalCents = minimumApplied ? sheet.minimumCents : subtotalCents;

	return { items, setupFeeCents, subtotalCents, minimumApplied, totalCents, unitCount };
}

export function redactForViewer(
	computed: ComputedEvaluation,
	role: Role,
	visibility: EstimatorVisibility
): RedactedEvaluation {
	if (role === 'admin') {
		return {
			priceVisibility: 'full',
			items: computed.items.map((item) => ({ ...item })),
			unitCount: computed.unitCount,
			setupFeeCents: computed.setupFeeCents,
			subtotalCents: computed.subtotalCents,
			minimumApplied: computed.minimumApplied,
			totalCents: computed.totalCents
		};
	}

	const metricsOnlyItems: RedactedItem[] = computed.items.map((item) => ({
		rowLabel: item.rowLabel,
		buttonLabel: item.buttonLabel,
		pricingUnit: item.pricingUnit,
		quantity: item.quantity
	}));

	if (visibility === 'grand_total') {
		// The floored total deliberately masks single-button prices (spec §4.5);
		// component amounts (setup fee, subtotal, minimum flag) would let an
		// estimator reverse out button values, so they are omitted entirely.
		return {
			priceVisibility: 'total_only',
			items: metricsOnlyItems,
			unitCount: computed.unitCount,
			totalCents: computed.totalCents
		};
	}

	return {
		priceVisibility: 'none',
		items: metricsOnlyItems,
		unitCount: computed.unitCount
	};
}

export function formatCents(cents: number): string {
	return (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}
