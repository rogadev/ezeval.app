import { requireOwner } from '$lib/server/guard';
import { billingEnabled } from '$lib/server/billing';
import { computeMetrics } from '$lib/server/metrics';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	// Owner-only: this reads across every tenant, so gate before touching data.
	requireOwner(locals);
	const metrics = await computeMetrics();
	return { metrics, billingEnabled: billingEnabled() };
};
