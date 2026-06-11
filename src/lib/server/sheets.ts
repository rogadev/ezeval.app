import { and, asc, eq, inArray } from 'drizzle-orm';
import { db } from './db';
import { priceSheets, priceSheetRows, priceSheetButtons } from './db/schema';
import { parseDollarsToCents } from '$lib/pricing/money';

export interface SheetGrid {
	id: string;
	name: string;
	setupFeeEnabled: boolean;
	setupFeeCents: number;
	estimatorVisibility: 'metrics_only' | 'grand_total';
	minimumCents: number;
	isDefault: boolean;
	rows: {
		id: string;
		label: string;
		buttons: {
			id: string;
			label: string;
			priceCents: number;
			pricingUnit: 'flat' | 'per_unit';
		}[];
	}[];
}

export async function listSheets(businessId: string) {
	return db
		.select()
		.from(priceSheets)
		.where(and(eq(priceSheets.businessId, businessId), eq(priceSheets.archived, false)))
		.orderBy(asc(priceSheets.createdAt));
}

export async function getSheetWithGrid(
	businessId: string,
	sheetId: string
): Promise<SheetGrid | null> {
	const [sheet] = await db
		.select()
		.from(priceSheets)
		.where(
			and(
				eq(priceSheets.id, sheetId),
				eq(priceSheets.businessId, businessId),
				eq(priceSheets.archived, false)
			)
		);
	if (!sheet) return null;

	const rows = await db
		.select()
		.from(priceSheetRows)
		.where(eq(priceSheetRows.priceSheetId, sheet.id))
		.orderBy(asc(priceSheetRows.position));

	const buttons = rows.length
		? await db
				.select()
				.from(priceSheetButtons)
				.where(
					inArray(
						priceSheetButtons.rowId,
						rows.map((r) => r.id)
					)
				)
				.orderBy(asc(priceSheetButtons.position))
		: [];

	return {
		id: sheet.id,
		name: sheet.name,
		setupFeeEnabled: sheet.setupFeeEnabled,
		setupFeeCents: sheet.setupFeeCents,
		estimatorVisibility: sheet.estimatorVisibility,
		minimumCents: sheet.minimumCents,
		isDefault: sheet.isDefault,
		rows: rows.map((row) => ({
			id: row.id,
			label: row.label,
			buttons: buttons
				.filter((b) => b.rowId === row.id)
				.map((b) => ({
					id: b.id,
					label: b.label,
					priceCents: b.priceCents,
					pricingUnit: b.pricingUnit
				}))
		}))
	};
}

/** Standard access-level rows pre-created on new sheets as a starting point. */
const STANDARD_ROWS = ['Special', 'High Level', 'Mid Level', 'Ground Level'];

export async function createSheet(businessId: string, name: string): Promise<string> {
	const [sheet] = await db.insert(priceSheets).values({ businessId, name }).returning();
	await db.insert(priceSheetRows).values(
		STANDARD_ROWS.map((label, index) => ({
			priceSheetId: sheet.id,
			label,
			position: index
		}))
	);
	return sheet.id;
}

// --- Definition payload: what the sheet editor posts (dollars as strings) ---

export interface SheetDefinitionPayload {
	name: string;
	setupFeeEnabled: boolean;
	setupFee: string;
	estimatorVisibility: 'metrics_only' | 'grand_total';
	minimum: string;
	rows: { label: string; buttons: { label: string; price: string; pricingUnit: string }[] }[];
}

const LIMITS = { rows: 10, buttonsPerRow: 10, label: 40, name: 60, maxCents: 1_000_000 };

type Validated =
	| { ok: true; sheet: ValidatedSheet }
	| { ok: false; message: string };

interface ValidatedSheet {
	name: string;
	setupFeeEnabled: boolean;
	setupFeeCents: number;
	estimatorVisibility: 'metrics_only' | 'grand_total';
	minimumCents: number;
	rows: {
		label: string;
		buttons: { label: string; priceCents: number; pricingUnit: 'flat' | 'per_unit' }[];
	}[];
}

export function validateSheetDefinition(raw: unknown): Validated {
	if (typeof raw !== 'object' || raw === null) return { ok: false, message: 'Invalid payload.' };
	const payload = raw as Partial<SheetDefinitionPayload>;

	const name = typeof payload.name === 'string' ? payload.name.trim() : '';
	if (!name) return { ok: false, message: 'Sheet name is required.' };
	if (name.length > LIMITS.name) return { ok: false, message: 'Sheet name is too long.' };

	if (
		payload.estimatorVisibility !== 'metrics_only' &&
		payload.estimatorVisibility !== 'grand_total'
	) {
		return { ok: false, message: 'Invalid estimator visibility mode.' };
	}

	const setupFeeCents = parseDollarsToCents(String(payload.setupFee ?? '0'));
	if (setupFeeCents === null || setupFeeCents > LIMITS.maxCents) {
		return { ok: false, message: 'Setup fee must be a valid dollar amount.' };
	}
	const minimumCents = parseDollarsToCents(String(payload.minimum ?? '0'));
	if (minimumCents === null || minimumCents > LIMITS.maxCents) {
		return { ok: false, message: 'Minimum quote must be a valid dollar amount.' };
	}

	if (!Array.isArray(payload.rows) || payload.rows.length === 0) {
		return { ok: false, message: 'A sheet needs at least one row.' };
	}
	if (payload.rows.length > LIMITS.rows) {
		return { ok: false, message: `Sheets support up to ${LIMITS.rows} rows.` };
	}

	const rows: ValidatedSheet['rows'] = [];
	for (const row of payload.rows) {
		const rowLabel = typeof row?.label === 'string' ? row.label.trim() : '';
		if (!rowLabel) return { ok: false, message: 'Every row needs a label.' };
		if (rowLabel.length > LIMITS.label) return { ok: false, message: 'Row label is too long.' };
		if (!Array.isArray(row.buttons)) return { ok: false, message: 'Invalid row buttons.' };
		if (row.buttons.length > LIMITS.buttonsPerRow) {
			return { ok: false, message: `Rows support up to ${LIMITS.buttonsPerRow} buttons.` };
		}

		const buttons: ValidatedSheet['rows'][number]['buttons'] = [];
		for (const button of row.buttons) {
			const label = typeof button?.label === 'string' ? button.label.trim() : '';
			if (!label) return { ok: false, message: `Every button in "${rowLabel}" needs a label.` };
			if (label.length > LIMITS.label) return { ok: false, message: 'Button label is too long.' };
			const priceCents = parseDollarsToCents(String(button.price ?? ''));
			if (priceCents === null || priceCents > LIMITS.maxCents) {
				return { ok: false, message: `"${label}" needs a valid price.` };
			}
			const pricingUnit = button.pricingUnit === 'per_unit' ? 'per_unit' : 'flat';
			buttons.push({ label, priceCents, pricingUnit });
		}
		rows.push({ label: rowLabel, buttons });
	}

	return {
		ok: true,
		sheet: {
			name,
			setupFeeEnabled: payload.setupFeeEnabled === true,
			setupFeeCents,
			estimatorVisibility: payload.estimatorVisibility,
			minimumCents,
			rows
		}
	};
}

/**
 * Persists a validated definition by replacing the sheet's rows and buttons.
 * Old button ids become dangling (evaluation items snapshot label + price, and
 * their buttonId FK is SET NULL), so replacement is history-safe.
 */
export async function saveSheetDefinition(
	businessId: string,
	sheetId: string,
	validated: ValidatedSheet
): Promise<boolean> {
	const [sheet] = await db
		.select({ id: priceSheets.id })
		.from(priceSheets)
		.where(and(eq(priceSheets.id, sheetId), eq(priceSheets.businessId, businessId)));
	if (!sheet) return false;

	await db
		.update(priceSheets)
		.set({
			name: validated.name,
			setupFeeEnabled: validated.setupFeeEnabled,
			setupFeeCents: validated.setupFeeCents,
			estimatorVisibility: validated.estimatorVisibility,
			minimumCents: validated.minimumCents
		})
		.where(eq(priceSheets.id, sheetId));

	await db.delete(priceSheetRows).where(eq(priceSheetRows.priceSheetId, sheetId));
	for (const [rowIndex, row] of validated.rows.entries()) {
		const [dbRow] = await db
			.insert(priceSheetRows)
			.values({ priceSheetId: sheetId, label: row.label, position: rowIndex })
			.returning();
		if (row.buttons.length) {
			await db.insert(priceSheetButtons).values(
				row.buttons.map((button, buttonIndex) => ({
					rowId: dbRow.id,
					label: button.label,
					priceCents: button.priceCents,
					pricingUnit: button.pricingUnit,
					position: buttonIndex
				}))
			);
		}
	}
	return true;
}
