/**
 * In-progress evaluation drafts, kept on the device so a refresh, a closed
 * tab, or a dropped signal doesn't lose a walk-through.
 *
 * A draft holds metrics only (button ids and tap counts, notes, customer id).
 * It never holds a price, so it is safe on a non-admin's phone.
 */

/** An in-progress evaluation as stored on the device: metrics and notes, never prices. */
export interface EvaluationDraft {
	/** buttonId -> tapped quantity, positive entries only. */
	counts: Record<string, number>;
	notes: string;
	/** The picked customer's id, or `''` when no customer is picked. */
	customerId: string;
	/** Epoch milliseconds of the last change. */
	savedAt: number;
}

/** Drafts older than this are dropped: the walk-through is stale by then. */
export const DRAFT_MAX_AGE_MS = 3 * 24 * 60 * 60 * 1000;

const MAX_QUANTITY = 10_000;

/**
 * Gets the storage key for one sheet's draft, scoped to a job or to a walk-up
 * with no job. The format is a storage contract: changing it orphans every
 * draft already saved on a device.
 */
export function draftKey(sheetId: string, jobId: string | null): string {
	return `ezeval:draft:${sheetId}:${jobId ?? 'walk-up'}`;
}

/** True when there is nothing worth keeping. */
export function isEmptyDraft(draft: Pick<EvaluationDraft, 'counts' | 'notes'>): boolean {
	return Object.values(draft.counts).every((n) => n <= 0) && draft.notes.trim() === '';
}

/** Serializes a draft to JSON for storage, dropping counts that are zero or negative. */
export function serializeDraft(draft: EvaluationDraft): string {
	const counts = Object.fromEntries(Object.entries(draft.counts).filter(([, n]) => n > 0));
	return JSON.stringify({ ...draft, counts });
}

/**
 * Reads a stored draft back, keeping only what is still valid for the sheet
 * as it is now. Returns null for missing, corrupt, expired, or empty drafts.
 */
export function parseDraft(
	raw: string | null,
	validButtonIds: ReadonlySet<string>,
	now: number
): EvaluationDraft | null {
	if (!raw) return null;

	let data: unknown;
	try {
		data = JSON.parse(raw);
	} catch {
		return null;
	}
	if (typeof data !== 'object' || data === null) return null;
	const record = data as Record<string, unknown>;

	const savedAt = record.savedAt;
	if (typeof savedAt !== 'number' || now - savedAt > DRAFT_MAX_AGE_MS) return null;

	const counts: Record<string, number> = {};
	if (typeof record.counts === 'object' && record.counts !== null) {
		for (const [id, value] of Object.entries(record.counts)) {
			if (!validButtonIds.has(id)) continue;
			if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) continue;
			counts[id] = Math.min(value, MAX_QUANTITY);
		}
	}

	const draft: EvaluationDraft = {
		counts,
		notes: typeof record.notes === 'string' ? record.notes : '',
		customerId: typeof record.customerId === 'string' ? record.customerId : '',
		savedAt
	};
	return isEmptyDraft(draft) ? null : draft;
}
