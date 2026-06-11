/**
 * Parses a human dollar string ("$1,234.56") into integer cents.
 * Empty input is 0; invalid input (garbage, negatives, sub-cent precision)
 * returns null so callers can reject the form field.
 */
export function parseDollarsToCents(input: string): number | null {
	const cleaned = input.trim().replace(/^\$/, '').replaceAll(',', '');
	if (cleaned === '') return 0;
	if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
	return Math.round(Number(cleaned) * 100);
}
