import { error, fail, redirect } from '@sveltejs/kit';
import { and, asc, eq, inArray } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { customers, evaluations, evaluationItems, jobs } from '$lib/server/db/schema';
import { requireUser } from '$lib/server/guard';
import { getSheetWithGrid } from '$lib/server/sheets';
import { computeEvaluation, type EvaluationInputItem } from '$lib/pricing/engine';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params, url }) => {
	const user = requireUser(locals);
	const sheet = await getSheetWithGrid(user.businessId, params.sheetId);
	if (!sheet) error(404, 'Price sheet not found');

	const isAdmin = user.role === 'admin';

	const customerList = await db
		.select({ id: customers.id, name: customers.name, animalNotes: customers.animalNotes })
		.from(customers)
		.where(eq(customers.businessId, user.businessId))
		.orderBy(asc(customers.name));

	// Optional job linkage (?job=) — preselects the job's customer.
	const jobId = url.searchParams.get('job');
	let job: { id: string; customerId: string } | null = null;
	if (jobId) {
		const [row] = await db
			.select({ id: jobs.id, customerId: jobs.customerId })
			.from(jobs)
			.where(and(eq(jobs.id, jobId), eq(jobs.businessId, user.businessId)));
		job = row ?? null;
	}

	return {
		// SECURITY: non-admins never receive button prices — the tap UI works
		// purely on metrics and the server reprices on save (spec §4.5).
		sheet: {
			id: sheet.id,
			name: sheet.name,
			estimatorVisibility: sheet.estimatorVisibility,
			rows: sheet.rows.map((row) => ({
				id: row.id,
				label: row.label,
				buttons: row.buttons.map((b) => ({
					id: b.id,
					label: b.label,
					pricingUnit: b.pricingUnit,
					...(isAdmin ? { priceCents: b.priceCents } : {})
				}))
			})),
			...(isAdmin
				? {
						setupFeeEnabled: sheet.setupFeeEnabled,
						setupFeeCents: sheet.setupFeeCents,
						minimumCents: sheet.minimumCents
					}
				: {})
		},
		priceMode: isAdmin
			? 'full'
			: sheet.estimatorVisibility === 'grand_total'
				? 'total_end'
				: 'none',
		customers: customerList,
		job
	};
};

export const actions: Actions = {
	save: async ({ locals, params, request }) => {
		const user = requireUser(locals);
		const sheet = await getSheetWithGrid(user.businessId, params.sheetId);
		if (!sheet) error(404, 'Price sheet not found');

		const form = await request.formData();
		let taps: unknown;
		try {
			taps = JSON.parse(String(form.get('items') ?? ''));
		} catch {
			return fail(400, { message: 'Invalid evaluation data.' });
		}
		if (!Array.isArray(taps)) return fail(400, { message: 'Invalid evaluation data.' });

		// Map tapped buttons back to server-side truth — client quantities only.
		const buttonIndex = new Map(
			sheet.rows.flatMap((row) => row.buttons.map((b) => [b.id, { row, button: b }] as const))
		);
		const inputs: EvaluationInputItem[] = [];
		for (const tap of taps) {
			const entry = buttonIndex.get(String((tap as { buttonId?: unknown }).buttonId));
			const quantity = Number((tap as { quantity?: unknown }).quantity);
			if (!entry) return fail(400, { message: 'Unknown button in evaluation.' });
			if (!Number.isInteger(quantity) || quantity < 0 || quantity > 10_000) {
				return fail(400, { message: 'Invalid quantity.' });
			}
			inputs.push({
				rowLabel: entry.row.label,
				buttonLabel: entry.button.label,
				pricingUnit: entry.button.pricingUnit,
				unitPriceCents: entry.button.priceCents,
				quantity
			});
		}
		if (inputs.every((i) => i.quantity === 0)) {
			return fail(400, { message: 'Tap at least one item before saving.' });
		}

		const customerId = String(form.get('customerId') ?? '') || null;
		if (customerId) {
			const [owned] = await db
				.select({ id: customers.id })
				.from(customers)
				.where(and(eq(customers.id, customerId), eq(customers.businessId, user.businessId)));
			if (!owned) return fail(400, { message: 'Unknown customer.' });
		}
		const jobId = String(form.get('jobId') ?? '') || null;
		if (jobId) {
			const [owned] = await db
				.select({ id: jobs.id })
				.from(jobs)
				.where(and(eq(jobs.id, jobId), eq(jobs.businessId, user.businessId)));
			if (!owned) return fail(400, { message: 'Unknown job.' });
		}
		const notes = String(form.get('notes') ?? '').trim() || null;

		const computed = computeEvaluation(sheet, inputs);

		const [saved] = await db
			.insert(evaluations)
			.values({
				businessId: user.businessId,
				priceSheetId: sheet.id,
				priceSheetName: sheet.name,
				jobId,
				customerId,
				createdBy: user.id,
				setupFeeCents: computed.setupFeeCents,
				subtotalCents: computed.subtotalCents,
				minimumApplied: computed.minimumApplied,
				totalCents: computed.totalCents,
				notes
			})
			.returning({ id: evaluations.id });

		if (computed.items.length) {
			await db.insert(evaluationItems).values(
				computed.items.map((item, index) => ({
					evaluationId: saved.id,
					buttonId: null, // sheet edits replace button rows; snapshots below are the record
					rowLabel: item.rowLabel,
					buttonLabel: item.buttonLabel,
					pricingUnit: item.pricingUnit,
					unitPriceCents: item.unitPriceCents,
					quantity: item.quantity,
					lineTotalCents: item.lineTotalCents,
					position: index
				}))
			);
		}

		// Completing an evaluation on a linked job moves it along.
		if (jobId) {
			await db
				.update(jobs)
				.set({ status: 'completed' })
				.where(and(eq(jobs.id, jobId), inArray(jobs.status, ['scheduled', 'in_progress'])));
		}

		redirect(303, `/app/evaluations/${saved.id}`);
	}
};
