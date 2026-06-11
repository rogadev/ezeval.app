import { fail, redirect } from '@sveltejs/kit';
import { and, eq, isNull, gt } from 'drizzle-orm';
import { APIError } from 'better-auth';
import { auth } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { businesses, invitations, user } from '$lib/server/db/schema';
import type { Actions, PageServerLoad } from './$types';

async function findOpenInvitation(token: string) {
	const [invite] = await db
		.select({
			id: invitations.id,
			businessId: invitations.businessId,
			role: invitations.role,
			email: invitations.email,
			businessName: businesses.name
		})
		.from(invitations)
		.innerJoin(businesses, eq(invitations.businessId, businesses.id))
		.where(
			and(
				eq(invitations.token, token),
				isNull(invitations.acceptedAt),
				gt(invitations.expiresAt, new Date())
			)
		);
	return invite;
}

export const load: PageServerLoad = async ({ params, locals }) => {
	if (locals.user?.businessId) redirect(303, '/app');
	const invite = await findOpenInvitation(params.token);
	if (!invite) {
		return { valid: false as const };
	}
	return {
		valid: true as const,
		businessName: invite.businessName,
		role: invite.role,
		email: invite.email
	};
};

export const actions: Actions = {
	default: async ({ request, params }) => {
		const invite = await findOpenInvitation(params.token);
		if (!invite) {
			return fail(400, { message: 'This invite link is no longer valid.', name: '', email: '' });
		}

		const form = await request.formData();
		const name = String(form.get('name') ?? '').trim();
		const email = String(form.get('email') ?? '').trim();
		const password = String(form.get('password') ?? '');

		if (!name || !email || !password) {
			return fail(400, { message: 'All fields are required.', name, email });
		}
		if (password.length < 8) {
			return fail(400, { message: 'Password must be at least 8 characters.', name, email });
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
				return fail(400, { message: e.message, name, email });
			}
			throw e;
		}

		await db
			.update(user)
			.set({ businessId: invite.businessId, role: invite.role })
			.where(eq(user.id, newUserId));
		await db
			.update(invitations)
			.set({ acceptedAt: new Date(), acceptedBy: newUserId })
			.where(eq(invitations.id, invite.id));

		redirect(303, '/app');
	}
};
