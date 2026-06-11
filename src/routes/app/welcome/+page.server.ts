import { redirect } from '@sveltejs/kit';
import { billingEnabled } from '$lib/server/billing';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	// This page only exists for the pinned-billing era (GH issue #3). Once
	// Stripe is live, signups go through the card-up-front trial flow instead.
	if (billingEnabled()) redirect(303, '/app');
};
