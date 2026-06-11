import { describe, it, expect } from 'vitest';
import { parseDollarsToCents } from './money';

describe('parseDollarsToCents', () => {
	it('parses plain dollar amounts', () => {
		expect(parseDollarsToCents('150')).toBe(15000);
		expect(parseDollarsToCents('5.50')).toBe(550);
		expect(parseDollarsToCents('0.01')).toBe(1);
	});

	it('accepts $ signs, commas, and surrounding whitespace', () => {
		expect(parseDollarsToCents(' $1,234.56 ')).toBe(123456);
		expect(parseDollarsToCents('$22.50')).toBe(2250);
	});

	it('rounds fractional cents from float artifacts', () => {
		expect(parseDollarsToCents('0.1')).toBe(10);
		expect(parseDollarsToCents('19.99')).toBe(1999);
	});

	it('treats empty input as zero', () => {
		expect(parseDollarsToCents('')).toBe(0);
		expect(parseDollarsToCents('  ')).toBe(0);
	});

	it('returns null for garbage, negatives, and >2 decimal places', () => {
		expect(parseDollarsToCents('abc')).toBeNull();
		expect(parseDollarsToCents('-5')).toBeNull();
		expect(parseDollarsToCents('1.234')).toBeNull();
		expect(parseDollarsToCents('1.2.3')).toBeNull();
	});
});
