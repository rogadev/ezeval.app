import { error, fail, redirect } from '@sveltejs/kit';
import { and, asc, eq, sql } from 'drizzle-orm';
import { db } from '$lib/server/db';
import {
	customers,
	jobs,
	jobWorkflowItems,
	priceSheets,
	user as userTable
} from '$lib/server/db/schema';
import { requireAdmin, requireUser } from '$lib/server/guard';
import type { Actions, PageServerLoad } from './$types';

async function loadJob(businessId: string, jobId: string) {
	const [job] = await db
		.select({
			id: jobs.id,
			status: jobs.status,
			scheduledDate: jobs.scheduledDate,
			fixedTime: jobs.fixedTime,
			notes: jobs.notes,
			assigneeId: jobs.assigneeId,
			priceSheetId: jobs.priceSheetId,
			customerId: jobs.customerId
		})
		.from(jobs)
		.where(and(eq(jobs.id, jobId), eq(jobs.businessId, businessId)));
	return job ?? null;
}

export const load: PageServerLoad = async ({ locals, params }) => {
	const user = requireUser(locals);
	const isAdmin = user.role === 'admin';

	const job = await loadJob(user.businessId, params.id);
	if (!job) error(404, 'Job not found');
	// Field staff can open only their assigned jobs.
	if (!isAdmin && job.assigneeId !== user.id) error(404, 'Job not found');

	const [customer] = await db
		.select({
			id: customers.id,
			name: customers.name,
			phone: customers.phone,
			addressLine1: customers.addressLine1,
			addressLine2: customers.addressLine2,
			city: customers.city,
			region: customers.region,
			propertyNotes: customers.propertyNotes,
			animalNotes: customers.animalNotes
		})
		.from(customers)
		.where(eq(customers.id, job.customerId));

	const checklist = await db
		.select()
		.from(jobWorkflowItems)
		.where(eq(jobWorkflowItems.jobId, job.id))
		.orderBy(asc(jobWorkflowItems.position));

	const [assignee] = job.assigneeId
		? await db
				.select({ name: userTable.name })
				.from(userTable)
				.where(eq(userTable.id, job.assigneeId))
		: [];

	const [sheet] = job.priceSheetId
		? await db
				.select({ id: priceSheets.id, name: priceSheets.name })
				.from(priceSheets)
				.where(and(eq(priceSheets.id, job.priceSheetId), eq(priceSheets.archived, false)))
		: [];

	return {
		job: {
			id: job.id,
			status: job.status,
			scheduledDate: job.scheduledDate,
			fixedTime: job.fixedTime,
			notes: job.notes,
			assigneeName: assignee?.name ?? null
		},
		customer,
		checklist,
		sheet: sheet ?? null
	};
};

export const actions: Actions = {
	toggleStep: async ({ locals, params, request }) => {
		const user = requireUser(locals);
		const job = await loadJob(user.businessId, params.id);
		if (!job) error(404, 'Job not found');
		if (user.role !== 'admin' && job.assigneeId !== user.id) error(404, 'Job not found');

		const form = await request.formData();
		const stepId = String(form.get('stepId') ?? '');
		await db
			.update(jobWorkflowItems)
			.set({
				completedAt: sql`CASE WHEN ${jobWorkflowItems.completedAt} IS NULL THEN now() ELSE NULL END`
			})
			.where(and(eq(jobWorkflowItems.id, stepId), eq(jobWorkflowItems.jobId, job.id)));

		// First checked step moves a scheduled job into progress.
		if (job.status === 'scheduled') {
			await db.update(jobs).set({ status: 'in_progress' }).where(eq(jobs.id, job.id));
		}
		return { ok: true };
	},

	setStatus: async ({ locals, params, request }) => {
		const user = requireUser(locals);
		const job = await loadJob(user.businessId, params.id);
		if (!job) error(404, 'Job not found');
		if (user.role !== 'admin' && job.assigneeId !== user.id) error(404, 'Job not found');

		const form = await request.formData();
		const status = String(form.get('status') ?? '');
		if (!['scheduled', 'in_progress', 'completed', 'canceled'].includes(status)) {
			return fail(400, { message: 'Invalid status.' });
		}
		await db
			.update(jobs)
			.set({ status: status as 'scheduled' | 'in_progress' | 'completed' | 'canceled' })
			.where(eq(jobs.id, job.id));
		return { ok: true };
	},

	delete: async ({ locals, params }) => {
		const user = requireAdmin(locals);
		await db.delete(jobs).where(and(eq(jobs.id, params.id), eq(jobs.businessId, user.businessId)));
		redirect(303, '/app/tasks');
	}
};
