import { error, fail } from '@sveltejs/kit';
import { requireAdmin } from '$lib/server/guard';
import { getSheetWithGrid, saveSheetDefinition, validateSheetDefinition } from '$lib/server/sheets';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
	const user = requireAdmin(locals);
	const sheet = await getSheetWithGrid(user.businessId, params.id);
	if (!sheet) error(404, 'Price sheet not found');
	return { sheet };
};

export const actions: Actions = {
	save: async ({ locals, params, request }) => {
		const user = requireAdmin(locals);
		const form = await request.formData();

		let parsed: unknown;
		try {
			parsed = JSON.parse(String(form.get('definition') ?? ''));
		} catch {
			return fail(400, { message: 'Invalid sheet data.' });
		}

		const validated = validateSheetDefinition(parsed);
		if (!validated.ok) return fail(400, { message: validated.message });

		const saved = await saveSheetDefinition(user.businessId, params.id, validated.sheet);
		if (!saved) error(404, 'Price sheet not found');

		return { saved: true };
	}
};
