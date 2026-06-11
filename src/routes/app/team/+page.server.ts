import { fail } from '@sveltejs/kit';
import { and, desc, eq, isNull } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { invitations, user as userTable } from '$lib/server/db/schema';
import { requireAdmin } from '$lib/server/guard';
import type { Actions, PageServerLoad } from './$types';

const INVITE_DAYS = 7;

export const load: PageServerLoad = async ({ locals }) => {
	const user = requireAdmin(locals);

	const members = await db
		.select({
			id: userTable.id,
			name: userTable.name,
			email: userTable.email,
			role: userTable.role,
			createdAt: userTable.createdAt
		})
		.from(userTable)
		.where(eq(userTable.businessId, user.businessId))
		.orderBy(desc(userTable.createdAt));

	const openInvites = await db
		.select({
			id: invitations.id,
			token: invitations.token,
			role: invitations.role,
			email: invitations.email,
			expiresAt: invitations.expiresAt
		})
		.from(invitations)
		.where(and(eq(invitations.businessId, user.businessId), isNull(invitations.acceptedAt)))
		.orderBy(desc(invitations.createdAt));

	return {
		members,
		invites: openInvites.filter((invite) => invite.expiresAt > new Date())
	};
};

export const actions: Actions = {
	invite: async ({ locals, request }) => {
		const user = requireAdmin(locals);
		const form = await request.formData();
		const role = String(form.get('role') ?? '');
		const email = String(form.get('email') ?? '').trim() || null;
		if (role !== 'estimator' && role !== 'technician' && role !== 'admin') {
			return fail(400, { message: 'Pick a role for the invite.' });
		}

		const token = crypto.randomUUID().replaceAll('-', '');
		await db.insert(invitations).values({
			token,
			businessId: user.businessId,
			role,
			email,
			expiresAt: new Date(Date.now() + INVITE_DAYS * 86_400_000)
		});
		return { created: true };
	},
	revoke: async ({ locals, request }) => {
		const user = requireAdmin(locals);
		const form = await request.formData();
		const id = String(form.get('id') ?? '');
		await db
			.delete(invitations)
			.where(and(eq(invitations.id, id), eq(invitations.businessId, user.businessId)));
		return { revoked: true };
	}
};
