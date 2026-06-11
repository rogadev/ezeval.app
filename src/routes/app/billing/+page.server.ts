import { fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { businesses } from '$lib/server/db/schema';
import { requireAdmin, requireUser } from '$lib/server/guard';
import {
	accessState,
	billingEnabled,
	createCheckoutSession,
	createPortalSession
} from '$lib/server/billing';
import type { Actions, PageServerLoad } from './$types';

async function loadBusiness(businessId: string) {
	const [business] = await db.select().from(businesses).where(eq(businesses.id, businessId));
	return business;
}

export const load: PageServerLoad = async ({ locals }) => {
	const user = requireUser(locals);
	const business = await loadBusiness(user.businessId);
	return {
		billing: {
			enabled: billingEnabled(),
			state: accessState(business),
			status: business.subscriptionStatus,
			trialEndsAt: business.trialEndsAt,
			hasCustomer: Boolean(business.stripeCustomerId)
		}
	};
};

export const actions: Actions = {
	subscribe: async ({ locals }) => {
		const user = requireAdmin(locals);
		if (!billingEnabled()) return fail(400, { message: 'Billing is not configured.' });
		const business = await loadBusiness(user.businessId);
		const url = await createCheckoutSession({
			businessId: business.id,
			businessName: business.name,
			customerEmail: business.contactEmail ?? user.email,
			stripeCustomerId: business.stripeCustomerId
		});
		redirect(303, url);
	},
	portal: async ({ locals }) => {
		const user = requireAdmin(locals);
		if (!billingEnabled()) return fail(400, { message: 'Billing is not configured.' });
		const business = await loadBusiness(user.businessId);
		if (!business.stripeCustomerId) return fail(400, { message: 'No billing account yet.' });
		const url = await createPortalSession(business.stripeCustomerId);
		redirect(303, url);
	}
};
