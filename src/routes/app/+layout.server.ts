import { error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { businesses } from '$lib/server/db/schema';
import { requireUser } from '$lib/server/guard';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
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

	return {
		user: { id: user.id, name: user.name, email: user.email, role: user.role },
		business
	};
};
