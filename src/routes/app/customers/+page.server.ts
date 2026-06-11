import { fail, redirect } from '@sveltejs/kit';
import { asc, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { customers } from '$lib/server/db/schema';
import { requireUser } from '$lib/server/guard';
import { geocodeAddress } from '$lib/server/geocode';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const user = requireUser(locals);
	const rows = await db
		.select({
			id: customers.id,
			name: customers.name,
			phone: customers.phone,
			addressLine1: customers.addressLine1,
			city: customers.city,
			animalNotes: customers.animalNotes
		})
		.from(customers)
		.where(eq(customers.businessId, user.businessId))
		.orderBy(asc(customers.name));
	return { customers: rows };
};

export const actions: Actions = {
	create: async ({ locals, request }) => {
		const user = requireUser(locals);
		const form = await request.formData();
		const name = String(form.get('name') ?? '').trim();
		if (!name) return fail(400, { message: 'Customer name is required.' });

		const fields = {
			email: String(form.get('email') ?? '').trim() || null,
			phone: String(form.get('phone') ?? '').trim() || null,
			addressLine1: String(form.get('addressLine1') ?? '').trim() || null,
			addressLine2: String(form.get('addressLine2') ?? '').trim() || null,
			city: String(form.get('city') ?? '').trim() || null,
			region: String(form.get('region') ?? '').trim() || null,
			postalCode: String(form.get('postalCode') ?? '').trim() || null,
			propertyNotes: String(form.get('propertyNotes') ?? '').trim() || null,
			animalNotes: String(form.get('animalNotes') ?? '').trim() || null
		};

		const geo = await geocodeAddress(fields);
		const [created] = await db
			.insert(customers)
			.values({
				businessId: user.businessId,
				name,
				...fields,
				lat: geo?.lat ?? null,
				lng: geo?.lng ?? null
			})
			.returning({ id: customers.id });

		redirect(303, `/app/customers/${created.id}`);
	}
};
