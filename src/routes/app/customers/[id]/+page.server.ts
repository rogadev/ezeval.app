import { error, fail, redirect } from '@sveltejs/kit';
import { and, desc, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { customers, evaluations, jobs, priceSheets } from '$lib/server/db/schema';
import { requireAdmin, requireUser } from '$lib/server/guard';
import { geocodeAddress } from '$lib/server/geocode';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
	const user = requireUser(locals);
	const isAdmin = user.role === 'admin';

	const [customer] = await db
		.select()
		.from(customers)
		.where(and(eq(customers.id, params.id), eq(customers.businessId, user.businessId)));
	if (!customer) error(404, 'Customer not found');

	const customerJobs = await db
		.select({
			id: jobs.id,
			scheduledDate: jobs.scheduledDate,
			fixedTime: jobs.fixedTime,
			status: jobs.status
		})
		.from(jobs)
		.where(and(eq(jobs.customerId, customer.id), eq(jobs.businessId, user.businessId)))
		.orderBy(desc(jobs.createdAt))
		.limit(20);

	const quoteRows = await db
		.select({
			id: evaluations.id,
			createdAt: evaluations.createdAt,
			totalCents: evaluations.totalCents,
			createdBy: evaluations.createdBy,
			estimatorVisibility: priceSheets.estimatorVisibility
		})
		.from(evaluations)
		.leftJoin(priceSheets, eq(evaluations.priceSheetId, priceSheets.id))
		.where(and(eq(evaluations.customerId, customer.id), eq(evaluations.businessId, user.businessId)))
		.orderBy(desc(evaluations.createdAt))
		.limit(20);

	return {
		customer: { ...customer, mapped: customer.lat !== null },
		jobs: customerJobs,
		quotes: quoteRows
			.filter((q) => isAdmin || q.createdBy === user.id)
			.map((q) => ({
				id: q.id,
				createdAt: q.createdAt,
				...(isAdmin || q.estimatorVisibility === 'grand_total' ? { totalCents: q.totalCents } : {})
			}))
	};
};

export const actions: Actions = {
	update: async ({ locals, params, request }) => {
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

		const result = await db
			.update(customers)
			.set({ name, ...fields, lat: geo?.lat ?? null, lng: geo?.lng ?? null })
			.where(and(eq(customers.id, params.id), eq(customers.businessId, user.businessId)))
			.returning({ id: customers.id });
		if (!result.length) error(404, 'Customer not found');

		return { saved: true };
	},
	delete: async ({ locals, params }) => {
		const user = requireAdmin(locals);
		await db
			.delete(customers)
			.where(and(eq(customers.id, params.id), eq(customers.businessId, user.businessId)));
		redirect(303, '/app/customers');
	}
};
