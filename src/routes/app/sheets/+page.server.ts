import { fail, redirect } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { priceSheets } from '$lib/server/db/schema';
import { requireAdmin, requireUser } from '$lib/server/guard';
import { createSheet, listSheets } from '$lib/server/sheets';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const user = requireUser(locals);
	const sheets = await listSheets(user.businessId);
	return {
		sheets: sheets.map((s) => ({
			id: s.id,
			name: s.name,
			isDefault: s.isDefault,
			setupFeeEnabled: s.setupFeeEnabled,
			estimatorVisibility: s.estimatorVisibility,
			minimumCents: s.minimumCents
		}))
	};
};

export const actions: Actions = {
	create: async ({ locals, request }) => {
		const user = requireAdmin(locals);
		const form = await request.formData();
		const name = String(form.get('name') ?? '').trim();
		if (!name) return fail(400, { message: 'Sheet name is required.' });
		if (name.length > 60) return fail(400, { message: 'Sheet name is too long.' });
		const sheetId = await createSheet(user.businessId, name);
		redirect(303, `/app/sheets/${sheetId}/edit`);
	},
	archive: async ({ locals, request }) => {
		const user = requireAdmin(locals);
		const form = await request.formData();
		const id = String(form.get('id') ?? '');
		await db
			.update(priceSheets)
			.set({ archived: true, isDefault: false })
			.where(and(eq(priceSheets.id, id), eq(priceSheets.businessId, user.businessId)));
		return { archived: true };
	}
};
