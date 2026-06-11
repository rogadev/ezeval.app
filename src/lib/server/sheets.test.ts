import { describe, it, expect } from 'vitest';
import { validateSheetDefinition } from './sheets';

const validPayload = () => ({
	name: 'Residential',
	setupFeeEnabled: true,
	setupFee: '22.50',
	estimatorVisibility: 'grand_total',
	minimum: '$150',
	rows: [
		{
			label: 'Special',
			buttons: [
				{ label: 'Skylight', price: '18', pricingUnit: 'flat' },
				{ label: 'French', price: '1.00', pricingUnit: 'per_unit' }
			]
		},
		{ label: 'Ground Level', buttons: [{ label: 'Small', price: '3', pricingUnit: 'flat' }] }
	]
});

describe('validateSheetDefinition', () => {
	it('accepts a valid payload and converts dollars to cents', () => {
		const result = validateSheetDefinition(validPayload());
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.sheet.setupFeeCents).toBe(2250);
		expect(result.sheet.minimumCents).toBe(15000);
		expect(result.sheet.rows[0].buttons[0].priceCents).toBe(1800);
		expect(result.sheet.rows[0].buttons[1].pricingUnit).toBe('per_unit');
	});

	it('rejects missing or blank names', () => {
		const result = validateSheetDefinition({ ...validPayload(), name: '  ' });
		expect(result).toEqual({ ok: false, message: 'Sheet name is required.' });
	});

	it('rejects invalid visibility modes', () => {
		const result = validateSheetDefinition({ ...validPayload(), estimatorVisibility: 'open' });
		expect(result.ok).toBe(false);
	});

	it('rejects bad prices with the button named in the message', () => {
		const payload = validPayload();
		payload.rows[1].buttons[0].price = 'abc';
		const result = validateSheetDefinition(payload);
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.message).toContain('Small');
	});

	it('rejects empty rows array and unlabeled buttons', () => {
		expect(validateSheetDefinition({ ...validPayload(), rows: [] }).ok).toBe(false);
		const payload = validPayload();
		payload.rows[0].buttons[0].label = '';
		expect(validateSheetDefinition(payload).ok).toBe(false);
	});

	it('coerces unknown pricing units to flat', () => {
		const payload = validPayload();
		payload.rows[0].buttons[0].pricingUnit = 'weird';
		const result = validateSheetDefinition(payload);
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.sheet.rows[0].buttons[0].pricingUnit).toBe('flat');
	});

	it('rejects non-object payloads', () => {
		expect(validateSheetDefinition(null).ok).toBe(false);
		expect(validateSheetDefinition('x').ok).toBe(false);
	});
});
