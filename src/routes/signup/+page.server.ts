import { fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { APIError } from 'better-auth';
import { auth } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { businesses, user } from '$lib/server/db/schema';
import { provisionBusinessDefaults } from '$lib/server/provision';
import type { Actions, PageServerLoad } from './$types';

const TRIAL_DAYS = 14;

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user?.businessId) redirect(303, '/app');
};

export const actions: Actions = {
	default: async ({ request }) => {
		const form = await request.formData();
		const name = String(form.get('name') ?? '').trim();
		const businessName = String(form.get('businessName') ?? '').trim();
		const email = String(form.get('email') ?? '').trim();
		const password = String(form.get('password') ?? '');

		if (!name || !businessName || !email || !password) {
			return fail(400, { message: 'All fields are required.', name, businessName, email });
		}
		if (password.length < 8) {
			return fail(400, {
				message: 'Password must be at least 8 characters.',
				name,
				businessName,
				email
			});
		}

		let newUserId: string;
		try {
			const result = await auth.api.signUpEmail({
				body: { name, email, password },
				headers: request.headers
			});
			newUserId = result.user.id;
		} catch (e) {
			if (e instanceof APIError) {
				return fail(400, { message: e.message, name, businessName, email });
			}
			throw e;
		}

		const trialEndsAt = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
		const [business] = await db
			.insert(businesses)
			.values({ name: businessName, contactEmail: email, trialEndsAt })
			.returning();
		await db
			.update(user)
			.set({ businessId: business.id, role: 'admin' })
			.where(eq(user.id, newUserId));
		await provisionBusinessDefaults(business.id);

		redirect(303, '/app');
	}
};
