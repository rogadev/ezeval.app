import { error, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { businesses } from '$lib/server/db/schema';
import { requireUser } from '$lib/server/guard';
import { accessState } from '$lib/server/billing';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	const user = requireUser(locals);

	const [business] = await db
		.select({
			id: businesses.id,
			name: businesses.name,
			subscriptionStatus: businesses.subscriptionStatus,
			trialEndsAt: businesses.trialEndsAt
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
		business,
		access
	};
};
