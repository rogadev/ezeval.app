import { fail } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { businesses } from '$lib/server/db/schema';
import { requireAdmin } from '$lib/server/guard';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const user = requireAdmin(locals);
	const [business] = await db
		.select({
			name: businesses.name,
			contactEmail: businesses.contactEmail,
			contactPhone: businesses.contactPhone,
			addressLine1: businesses.addressLine1,
			addressLine2: businesses.addressLine2,
			city: businesses.city,
			region: businesses.region,
			postalCode: businesses.postalCode,
			country: businesses.country
		})
		.from(businesses)
		.where(eq(businesses.id, user.businessId));
	return { businessInfo: business };
};

export const actions: Actions = {
	default: async ({ locals, request }) => {
		const user = requireAdmin(locals);
		const form = await request.formData();
		const name = String(form.get('name') ?? '').trim();
		if (!name) return fail(400, { message: 'Business name is required.' });

		await db
			.update(businesses)
			.set({
				name,
				contactEmail: String(form.get('contactEmail') ?? '').trim() || null,
				contactPhone: String(form.get('contactPhone') ?? '').trim() || null,
				addressLine1: String(form.get('addressLine1') ?? '').trim() || null,
				addressLine2: String(form.get('addressLine2') ?? '').trim() || null,
				city: String(form.get('city') ?? '').trim() || null,
				region: String(form.get('region') ?? '').trim() || null,
				postalCode: String(form.get('postalCode') ?? '').trim() || null,
				country: String(form.get('country') ?? '').trim() || null
			})
			.where(eq(businesses.id, user.businessId));

		return { saved: true };
	}
};
