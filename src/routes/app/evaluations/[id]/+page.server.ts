import { error, fail } from '@sveltejs/kit';
import { and, asc, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import {
	customers,
	evaluations,
	evaluationItems,
	evaluationTaxes,
	priceSheets,
	user as userTable
} from '$lib/server/db/schema';
import { requireUser } from '$lib/server/guard';
import { geocodeAddress } from '$lib/server/geocode';
import { redactForViewer, type ComputedEvaluation } from '$lib/pricing/engine';
import type { Actions, PageServerLoad } from './$types';

/** The viewing rule doubles as the editing rule: admins or the quote's author. */
async function requireEditableEvaluation(locals: App.Locals, evaluationId: string) {
	const user = requireUser(locals);
	const [evaluation] = await db
		.select({ id: evaluations.id, createdBy: evaluations.createdBy })
		.from(evaluations)
		.where(and(eq(evaluations.id, evaluationId), eq(evaluations.businessId, user.businessId)));
	if (!evaluation) error(404, 'Evaluation not found');
	if (user.role !== 'admin' && evaluation.createdBy !== user.id) {
		error(404, 'Evaluation not found');
	}
	return { user, evaluation };
}

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
			customerId: evaluations.customerId,
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

	// Snapshotted tax lines ride along whenever the total itself is visible —
	// tax rates are public knowledge, so they leak nothing in grand-total mode.
	const taxRows =
		view.totalCents !== undefined
			? await db
					.select({
						name: evaluationTaxes.name,
						rateMilliPct: evaluationTaxes.rateMilliPct,
						amountCents: evaluationTaxes.amountCents
					})
					.from(evaluationTaxes)
					.where(eq(evaluationTaxes.evaluationId, evaluation.id))
					.orderBy(asc(evaluationTaxes.position))
			: [];

	// Unattached quotes offer the pick-or-create customer flow.
	const attachableCustomers = evaluation.customerId
		? []
		: await db
				.select({ id: customers.id, name: customers.name })
				.from(customers)
				.where(eq(customers.businessId, user.businessId))
				.orderBy(asc(customers.name));

	return {
		taxes: taxRows,
		totalWithTaxCents:
			view.totalCents !== undefined
				? view.totalCents + taxRows.reduce((sum, tax) => sum + tax.amountCents, 0)
				: undefined,
		evaluation: {
			id: evaluation.id,
			sheetName: evaluation.sheetName,
			customerId: evaluation.customerId,
			customerName: evaluation.customerName,
			createdByName: evaluation.createdByName,
			createdAt: evaluation.createdAt,
			notes: evaluation.notes
		},
		attachableCustomers,
		view
	};
};

export const actions: Actions = {
	attachCustomer: async ({ locals, params, request }) => {
		const { user, evaluation } = await requireEditableEvaluation(locals, params.id);
		const form = await request.formData();
		const customerId = String(form.get('customerId') ?? '');
		const [owned] = await db
			.select({ id: customers.id })
			.from(customers)
			.where(and(eq(customers.id, customerId), eq(customers.businessId, user.businessId)));
		if (!owned) return fail(400, { message: 'Pick a customer to attach.' });

		await db
			.update(evaluations)
			.set({ customerId: owned.id })
			.where(eq(evaluations.id, evaluation.id));
		return { attached: true };
	},

	createAndAttach: async ({ locals, params, request }) => {
		const { user, evaluation } = await requireEditableEvaluation(locals, params.id);
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
		await db
			.update(evaluations)
			.set({ customerId: created.id })
			.where(eq(evaluations.id, evaluation.id));
		return { attached: true };
	}
};
