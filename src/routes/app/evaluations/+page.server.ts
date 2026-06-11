import { desc, eq, and } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { customers, evaluations, priceSheets, user as userTable } from '$lib/server/db/schema';
import { requireUser } from '$lib/server/guard';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const user = requireUser(locals);
	const isAdmin = user.role === 'admin';

	const rows = await db
		.select({
			id: evaluations.id,
			sheetName: evaluations.priceSheetName,
			customerName: customers.name,
			createdByName: userTable.name,
			createdAt: evaluations.createdAt,
			totalCents: evaluations.totalCents,
			estimatorVisibility: priceSheets.estimatorVisibility
		})
		.from(evaluations)
		.leftJoin(customers, eq(evaluations.customerId, customers.id))
		.leftJoin(userTable, eq(evaluations.createdBy, userTable.id))
		.leftJoin(priceSheets, eq(evaluations.priceSheetId, priceSheets.id))
		.where(
			isAdmin
				? eq(evaluations.businessId, user.businessId)
				: // Field staff see only their own captures.
					and(eq(evaluations.businessId, user.businessId), eq(evaluations.createdBy, user.id))
		)
		.orderBy(desc(evaluations.createdAt))
		.limit(100);

	return {
		evaluations: rows.map((row) => {
			// Redact totals per the sheet's visibility for non-admins; sheets that
			// were deleted fall back to metrics-only (most restrictive).
			const visibility = row.estimatorVisibility ?? 'metrics_only';
			const showTotal = isAdmin || visibility === 'grand_total';
			return {
				id: row.id,
				sheetName: row.sheetName,
				customerName: row.customerName,
				createdByName: row.createdByName,
				createdAt: row.createdAt,
				...(showTotal ? { totalCents: row.totalCents } : {})
			};
		})
	};
};
