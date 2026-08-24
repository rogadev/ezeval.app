/**
 * Operating costs for the owner metrics dashboard.
 *
 * These are PLACEHOLDERS — edit them to your real monthly bills. They live in
 * code (not the DB) because they change rarely and are the owner's private
 * numbers. All amounts are integer cents, matching the money convention used
 * everywhere else in the app.
 */

export type FixedCost = { label: string; cents: number };

/** Recurring monthly infrastructure costs. Update to your actual invoices. */
export const MONTHLY_FIXED_COSTS_CENTS: FixedCost[] = [
	{ label: 'Hosting (Vercel)', cents: 2000 },
	{ label: 'Database (Neon)', cents: 1900 },
	{ label: 'Domain', cents: 150 }
];

/** Stripe processing fee, used to estimate fees on recognized revenue. */
export const STRIPE_FEE_PERCENT = 2.9;
export const STRIPE_FEE_FIXED_CENTS = 30;

export function totalFixedCostsCents(): number {
	return MONTHLY_FIXED_COSTS_CENTS.reduce((sum, c) => sum + c.cents, 0);
}

/**
 * Estimated Stripe fees on a month's revenue. Approximates one charge per
 * paying subscriber (fixed fee counted `payingCount` times).
 */
export function estimatedStripeFeesCents(revenueCents: number, payingCount: number): number {
	if (revenueCents <= 0) return 0;
	return (
		Math.round(revenueCents * (STRIPE_FEE_PERCENT / 100)) + STRIPE_FEE_FIXED_CENTS * payingCount
	);
}
