import { error } from '@sveltejs/kit';
import { and, asc, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import {
	customers,
	evaluations,
	evaluationItems,
	priceSheets,
	user as userTable
} from '$lib/server/db/schema';
import { requireUser } from '$lib/server/guard';
import { redactForViewer, type ComputedEvaluation } from '$lib/pricing/engine';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
	const user = requireUser(locals);
	const isAdmin = user.role === 'admin';

	const [evaluation] = await db
		.select({
			id: evaluations.id,
			sheetName: evaluations.priceSheetName,
			createdAt: evaluations.createdAt,
			createdBy: evaluations.createdBy,
			notes: evaluations.notes,
			setupFeeCents: evaluations.setupFeeCents,
			subtotalCents: evaluations.subtotalCents,
			minimumApplied: evaluations.minimumApplied,
			totalCents: evaluations.totalCents,
			customerName: customers.name,
			createdByName: userTable.name,
			estimatorVisibility: priceSheets.estimatorVisibility
		})
		.from(evaluations)
		.leftJoin(customers, eq(evaluations.customerId, customers.id))
		.leftJoin(userTable, eq(evaluations.createdBy, userTable.id))
		.leftJoin(priceSheets, eq(evaluations.priceSheetId, priceSheets.id))
		.where(and(eq(evaluations.id, params.id), eq(evaluations.businessId, user.businessId)));
	if (!evaluation) error(404, 'Evaluation not found');
	// Field staff can open only their own evaluations.
	if (!isAdmin && evaluation.createdBy !== user.id) error(404, 'Evaluation not found');

	const items = await db
		.select()
		.from(evaluationItems)
		.where(eq(evaluationItems.evaluationId, evaluation.id))
		.orderBy(asc(evaluationItems.position));

	// Rebuild the computed shape from stored snapshots, then redact for the
	// viewer exactly like at capture time. Deleted sheets fall back to
	// metrics-only (most restrictive).
	const computed: ComputedEvaluation = {
		items: items.map((item) => ({
			rowLabel: item.rowLabel,
			buttonLabel: item.buttonLabel,
			pricingUnit: item.pricingUnit,
			unitPriceCents: item.unitPriceCents,
			quantity: item.quantity,
			lineTotalCents: item.lineTotalCents
		})),
		setupFeeCents: evaluation.setupFeeCents,
		subtotalCents: evaluation.subtotalCents,
		minimumApplied: evaluation.minimumApplied,
		totalCents: evaluation.totalCents,
		unitCount: items.reduce((sum, item) => sum + item.quantity, 0)
	};
	const view = redactForViewer(
		computed,
		user.role,
		evaluation.estimatorVisibility ?? 'metrics_only'
	);

	return {
		evaluation: {
			id: evaluation.id,
			sheetName: evaluation.sheetName,
			customerName: evaluation.customerName,
			createdByName: evaluation.createdByName,
			createdAt: evaluation.createdAt,
			notes: evaluation.notes
		},
		view
	};
};
