import { fail, redirect } from '@sveltejs/kit';
import { and, asc, desc, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import {
	customers,
	jobs,
	jobWorkflowItems,
	priceSheets,
	user as userTable,
	workflowSteps,
	workflowTemplates
} from '$lib/server/db/schema';
import { requireAdmin, requireUser } from '$lib/server/guard';
import { listSheets } from '$lib/server/sheets';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const user = requireUser(locals);
	const isAdmin = user.role === 'admin';

	const rows = await db
		.select({
			id: jobs.id,
			scheduledDate: jobs.scheduledDate,
			fixedTime: jobs.fixedTime,
			status: jobs.status,
			routeOrder: jobs.routeOrder,
			customerName: customers.name,
			customerCity: customers.city,
			animalNotes: customers.animalNotes,
			assigneeName: userTable.name
		})
		.from(jobs)
		.innerJoin(customers, eq(jobs.customerId, customers.id))
		.leftJoin(userTable, eq(jobs.assigneeId, userTable.id))
		.where(
			isAdmin
				? eq(jobs.businessId, user.businessId)
				: and(eq(jobs.businessId, user.businessId), eq(jobs.assigneeId, user.id))
		)
		.orderBy(desc(jobs.scheduledDate), asc(jobs.routeOrder), asc(jobs.fixedTime))
		.limit(200);

	if (!isAdmin) return { jobs: rows, createOptions: null };

	const [customerList, members, sheets, templates] = await Promise.all([
		db
			.select({ id: customers.id, name: customers.name })
			.from(customers)
			.where(eq(customers.businessId, user.businessId))
			.orderBy(asc(customers.name)),
		db
			.select({ id: userTable.id, name: userTable.name, role: userTable.role })
			.from(userTable)
			.where(eq(userTable.businessId, user.businessId))
			.orderBy(asc(userTable.name)),
		listSheets(user.businessId),
		db
			.select({
				id: workflowTemplates.id,
				name: workflowTemplates.name,
				isDefault: workflowTemplates.isDefault
			})
			.from(workflowTemplates)
			.where(eq(workflowTemplates.businessId, user.businessId))
			.orderBy(asc(workflowTemplates.createdAt))
	]);

	return {
		jobs: rows,
		createOptions: {
			customers: customerList,
			members,
			sheets: sheets.map((s) => ({ id: s.id, name: s.name })),
			templates
		}
	};
};

export const actions: Actions = {
	create: async ({ locals, request }) => {
		const user = requireAdmin(locals);
		const form = await request.formData();

		const customerId = String(form.get('customerId') ?? '');
		const assigneeId = String(form.get('assigneeId') ?? '') || null;
		const priceSheetId = String(form.get('priceSheetId') ?? '') || null;
		const scheduledDate = String(form.get('scheduledDate') ?? '') || null;
		const fixedTime = String(form.get('fixedTime') ?? '') || null;
		const templateId = String(form.get('templateId') ?? '') || null;
		const notes = String(form.get('notes') ?? '').trim() || null;

		const [customer] = await db
			.select({ id: customers.id })
			.from(customers)
			.where(and(eq(customers.id, customerId), eq(customers.businessId, user.businessId)));
		if (!customer) return fail(400, { message: 'Pick a customer.' });

		if (assigneeId) {
			const [member] = await db
				.select({ id: userTable.id })
				.from(userTable)
				.where(and(eq(userTable.id, assigneeId), eq(userTable.businessId, user.businessId)));
			if (!member) return fail(400, { message: 'Unknown assignee.' });
		}
		if (priceSheetId) {
			const [sheet] = await db
				.select({ id: priceSheets.id })
				.from(priceSheets)
				.where(and(eq(priceSheets.id, priceSheetId), eq(priceSheets.businessId, user.businessId)));
			if (!sheet) return fail(400, { message: 'Unknown price sheet.' });
		}
		if (scheduledDate && !/^\d{4}-\d{2}-\d{2}$/.test(scheduledDate)) {
			return fail(400, { message: 'Invalid date.' });
		}
		if (fixedTime && !/^\d{2}:\d{2}$/.test(fixedTime)) {
			return fail(400, { message: 'Invalid time.' });
		}

		const [job] = await db
			.insert(jobs)
			.values({
				businessId: user.businessId,
				customerId,
				assigneeId,
				priceSheetId,
				scheduledDate,
				fixedTime,
				notes
			})
			.returning({ id: jobs.id });

		// Snapshot the chosen (or default) workflow's steps onto the job.
		let template = templateId;
		if (!template) {
			const [def] = await db
				.select({ id: workflowTemplates.id })
				.from(workflowTemplates)
				.where(
					and(
						eq(workflowTemplates.businessId, user.businessId),
						eq(workflowTemplates.isDefault, true)
					)
				);
			template = def?.id ?? null;
		}
		if (template) {
			const steps = await db
				.select({ label: workflowSteps.label, position: workflowSteps.position })
				.from(workflowSteps)
				.innerJoin(workflowTemplates, eq(workflowSteps.templateId, workflowTemplates.id))
				.where(
					and(
						eq(workflowSteps.templateId, template),
						eq(workflowTemplates.businessId, user.businessId)
					)
				)
				.orderBy(asc(workflowSteps.position));
			if (steps.length) {
				await db
					.insert(jobWorkflowItems)
					.values(
						steps.map((step) => ({ jobId: job.id, label: step.label, position: step.position }))
					);
			}
		}

		redirect(303, `/app/tasks/${job.id}`);
	}
};
