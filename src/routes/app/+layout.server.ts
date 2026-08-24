import { error, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { businesses } from '$lib/server/db/schema';
import { isOwner, requireUser } from '$lib/server/guard';
import { accessState, billingEnabled } from '$lib/server/billing';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	const user = requireUser(locals);

	const [business] = await db
		.select({
			id: businesses.id,
			name: businesses.name,
			subscriptionStatus: businesses.subscriptionStatus,
			trialEndsAt: businesses.trialEndsAt,
			comped: businesses.comped
		})
		.from(businesses)
		.where(eq(businesses.id, user.businessId));
	if (!business) error(500, 'Business record missing');

	// Subscription gating: a lapsed business is locked to the billing page
	// (which explains the state to non-admins). /app/more stays reachable so
	// people can still sign out.
	const access = accessState(business);
	if (
		access === 'locked' &&
		!url.pathname.startsWith('/app/billing') &&
		!url.pathname.startsWith('/app/more')
	) {
		redirect(303, '/app/billing');
	}

	return {
		user: { id: user.id, name: user.name, email: user.email, role: user.role },
		isOwner: isOwner(user),
		business,
		access,
		// Billing is pinned until Stripe is configured (see GH issue) — when
		// false, the UI hides trial banners and billing nav entirely.
		billingEnabled: billingEnabled()
	};
};
