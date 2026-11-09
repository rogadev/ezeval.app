import { describe, expect, it } from 'vitest';
import {
	DRAFT_MAX_AGE_MS,
	draftKey,
	isEmptyDraft,
	parseDraft,
	serializeDraft,
	type EvaluationDraft
} from './draft';

const NOW = 1_800_000_000_000;
const buttons = new Set(['a', 'b']);

function stored(overrides: Partial<EvaluationDraft> = {}): string {
	return JSON.stringify({
		counts: { a: 3, b: 1 },
		notes: 'gate code 1234',
		customerId: 'cust-1',
		savedAt: NOW - 1000,
		...overrides
	});
}

describe('draftKey', () => {
	it('separates a walk-up from a job on the same sheet', () => {
		expect(draftKey('sheet-1', null)).not.toBe(draftKey('sheet-1', 'job-9'));
	});
});

describe('serializeDraft', () => {
	it('round-trips a draft and drops zero counts', () => {
		const raw = serializeDraft({
			counts: { a: 2, b: 0 },
			notes: '',
			customerId: '',
			savedAt: NOW
		});
		expect(parseDraft(raw, buttons, NOW)).toEqual({
			counts: { a: 2 },
			notes: '',
			customerId: '',
			savedAt: NOW
		});
	});
});

describe('parseDraft', () => {
	it('restores counts, notes, and customer', () => {
		expect(parseDraft(stored(), buttons, NOW)).toEqual({
			counts: { a: 3, b: 1 },
			notes: 'gate code 1234',
			customerId: 'cust-1',
			savedAt: NOW - 1000
		});
	});

	it('returns null for missing or corrupt storage', () => {
		expect(parseDraft(null, buttons, NOW)).toBeNull();
		expect(parseDraft('{not json', buttons, NOW)).toBeNull();
		expect(parseDraft('"a string"', buttons, NOW)).toBeNull();
		expect(parseDraft('null', buttons, NOW)).toBeNull();
	});

	it('drops a draft past the maximum age', () => {
		const raw = stored({ savedAt: NOW - DRAFT_MAX_AGE_MS - 1 });
		expect(parseDraft(raw, buttons, NOW)).toBeNull();
	});

	it('ignores buttons that are no longer on the sheet', () => {
		const raw = stored({ counts: { a: 2, removed: 7 }, notes: '' });
		expect(parseDraft(raw, buttons, NOW)?.counts).toEqual({ a: 2 });
	});

	it('ignores quantities that are not positive whole numbers', () => {
		const raw = JSON.stringify({
			counts: { a: -1, b: 1.5 },
			notes: 'keep me',
			customerId: '',
			savedAt: NOW
		});
		expect(parseDraft(raw, buttons, NOW)?.counts).toEqual({});
	});

	it('caps a quantity at the server limit', () => {
		const raw = stored({ counts: { a: 50_000 } });
		expect(parseDraft(raw, buttons, NOW)?.counts).toEqual({ a: 10_000 });
	});

	it('returns null when nothing valid is left', () => {
		const raw = stored({ counts: { removed: 4 }, notes: '   ' });
		expect(parseDraft(raw, buttons, NOW)).toBeNull();
	});
});

describe('isEmptyDraft', () => {
	it('treats notes alone as worth keeping', () => {
		expect(isEmptyDraft({ counts: {}, notes: 'side gate' })).toBe(false);
		expect(isEmptyDraft({ counts: { a: 0 }, notes: ' ' })).toBe(true);
	});
});
