import { and, asc, eq, sql } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { customers, jobs, jobWorkflowItems, user as userTable } from '$lib/server/db/schema';
import { requireUser } from '$lib/server/guard';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const user = requireUser(locals);
	const isAdmin = user.role === 'admin';
	const today = new Date().toISOString().slice(0, 10);

	const rows = await db
		.select({
			id: jobs.id,
			fixedTime: jobs.fixedTime,
			status: jobs.status,
			routeOrder: jobs.routeOrder,
			customerName: customers.name,
			addressLine1: customers.addressLine1,
			city: customers.city,
			animalNotes: customers.animalNotes,
			assigneeName: userTable.name,
			stepsDone: sql<number>`(SELECT count(*)::int FROM ${jobWorkflowItems} w WHERE w.job_id = ${jobs.id} AND w.completed_at IS NOT NULL)`,
			stepsTotal: sql<number>`(SELECT count(*)::int FROM ${jobWorkflowItems} w WHERE w.job_id = ${jobs.id})`
		})
		.from(jobs)
		.innerJoin(customers, eq(jobs.customerId, customers.id))
		.leftJoin(userTable, eq(jobs.assigneeId, userTable.id))
		.where(
			and(
				eq(jobs.businessId, user.businessId),
				eq(jobs.scheduledDate, today),
				isAdmin ? undefined : eq(jobs.assigneeId, user.id)
			)
		)
		.orderBy(asc(jobs.routeOrder), asc(jobs.fixedTime), asc(jobs.createdAt));

	const active = rows.filter((j) => j.status === 'scheduled' || j.status === 'in_progress');

	return {
		today,
		todaysJobs: rows,
		nextJob: active[0] ?? null
	};
};
