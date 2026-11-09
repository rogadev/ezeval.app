import type { PricingUnit } from './engine';

export interface SampleButton {
	id: string;
	label: string;
	priceCents: number;
	pricingUnit: PricingUnit;
}

export interface SampleRow {
	label: string;
	/** One line on what the access level means on the job. */
	hint: string;
	buttons: SampleButton[];
}

export interface SampleSheet {
	setupFeeEnabled: boolean;
	setupFeeCents: number;
	minimumCents: number;
	rows: SampleRow[];
}

/**
 * The example sheet behind the public demo and price calculator. It mirrors
 * the starter sheet every new business gets, so what a visitor taps on the
 * marketing site is what they find after signing up.
 */
export const SAMPLE_SHEET: SampleSheet = {
	setupFeeEnabled: true,
	setupFeeCents: 2250,
	minimumCents: 15000,
	rows: [
		{
			label: 'Special',
			hint: 'Priced on their own',
			buttons: [
				{ id: 'special-skylight', label: 'Skylight', priceCents: 1800, pricingUnit: 'flat' },
				{ id: 'special-french', label: 'French', priceCents: 100, pricingUnit: 'per_unit' }
			]
		},
		{
			label: 'High level',
			hint: 'Roof and rope work',
			buttons: [
				{ id: 'high-small', label: 'Small', priceCents: 500, pricingUnit: 'flat' },
				{ id: 'high-medium', label: 'Medium', priceCents: 600, pricingUnit: 'flat' },
				{ id: 'high-large', label: 'Large', priceCents: 700, pricingUnit: 'flat' }
			]
		},
		{
			label: 'Mid level',
			hint: 'Water-fed pole',
			buttons: [
				{ id: 'mid-small', label: 'Small', priceCents: 400, pricingUnit: 'flat' },
				{ id: 'mid-medium', label: 'Medium', priceCents: 500, pricingUnit: 'flat' },
				{ id: 'mid-large', label: 'Large', priceCents: 600, pricingUnit: 'flat' }
			]
		},
		{
			label: 'Ground level',
			hint: 'Walk-up glass',
			buttons: [
				{ id: 'ground-small', label: 'Small', priceCents: 300, pricingUnit: 'flat' },
				{ id: 'ground-medium', label: 'Medium', priceCents: 400, pricingUnit: 'flat' },
				{ id: 'ground-large', label: 'Large', priceCents: 550, pricingUnit: 'flat' }
			]
		}
	]
};

/** A half-finished walk-through, so the demo opens with numbers already on it. */
export const SAMPLE_COUNTS: Record<string, number> = {
	'special-skylight': 1,
	'special-french': 14,
	'high-medium': 4,
	'high-large': 3,
	'mid-small': 4,
	'mid-medium': 6,
	'ground-small': 6,
	'ground-medium': 5,
	'ground-large': 2
};
