import { and, asc, eq, inArray } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { customers, jobs } from '$lib/server/db/schema';
import { requireUser } from '$lib/server/guard';
import { optimizeRoute, type Stop } from '$lib/routing/optimize';
import type { Actions, PageServerLoad } from './$types';

function dayParam(url: URL): string {
	const date = url.searchParams.get('date');
	return date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : new Date().toISOString().slice(0, 10);
}

async function loadDay(businessId: string, date: string, assigneeId: string | null) {
	return db
		.select({
			id: jobs.id,
			fixedTime: jobs.fixedTime,
			routeOrder: jobs.routeOrder,
			status: jobs.status,
			assigneeId: jobs.assigneeId,
			customerName: customers.name,
			addressLine1: customers.addressLine1,
			city: customers.city,
			animalNotes: customers.animalNotes,
			lat: customers.lat,
			lng: customers.lng
		})
		.from(jobs)
		.innerJoin(customers, eq(jobs.customerId, customers.id))
		.where(
			and(
				eq(jobs.businessId, businessId),
				eq(jobs.scheduledDate, date),
				inArray(jobs.status, ['scheduled', 'in_progress']),
				assigneeId ? eq(jobs.assigneeId, assigneeId) : undefined
			)
		)
		.orderBy(asc(jobs.routeOrder), asc(jobs.fixedTime), asc(jobs.createdAt));
}

export const load: PageServerLoad = async ({ locals, url }) => {
	const user = requireUser(locals);
	const isAdmin = user.role === 'admin';
	const date = dayParam(url);
	const rows = await loadDay(user.businessId, date, isAdmin ? null : user.id);
	return { date, stops: rows };
};

export const actions: Actions = {
	optimize: async ({ locals, request }) => {
		const user = requireUser(locals);
		const isAdmin = user.role === 'admin';
		const form = await request.formData();
		const date = String(form.get('date') ?? '');
		if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { optimized: 0 };

		const rows = await loadDay(user.businessId, date, isAdmin ? null : user.id);

		// Optimize each assignee's run independently — a route across two
		// people's days would be meaningless.
		const groups = new Map<string, typeof rows>();
		for (const row of rows) {
			const key = row.assigneeId ?? 'unassigned';
			groups.set(key, [...(groups.get(key) ?? []), row]);
		}

		let optimized = 0;
		for (const group of groups.values()) {
			const mapped: Stop[] = group
				.filter((r) => r.lat !== null && r.lng !== null)
				.map((r) => ({ id: r.id, lat: r.lat!, lng: r.lng!, fixedTime: r.fixedTime }));
			if (mapped.length < 2) continue;
			const order = optimizeRoute(mapped);
			for (const [index, jobId] of order.entries()) {
				await db.update(jobs).set({ routeOrder: index }).where(eq(jobs.id, jobId));
			}
			optimized += order.length;
		}
		return { optimized };
	}
};
