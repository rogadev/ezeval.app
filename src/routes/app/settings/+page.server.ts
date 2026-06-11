import { fail } from '@sveltejs/kit';
import { asc, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { businesses, businessTaxes } from '$lib/server/db/schema';
import { requireAdmin } from '$lib/server/guard';
import type { Actions, PageServerLoad } from './$types';

const TAX_LIMITS = { count: 6, name: 20, maxMilliPct: 50_000 };

/** "5" or "9.975" (percent) -> integer milli-percent, or null if invalid. */
function parseTaxRate(input: string): number | null {
	const cleaned = input.trim().replace(/%$/, '');
	if (!/^\d{1,2}(\.\d{1,3})?$/.test(cleaned)) return null;
	const milli = Math.round(Number(cleaned) * 1000);
	return milli > TAX_LIMITS.maxMilliPct ? null : milli;
}

export const load: PageServerLoad = async ({ locals }) => {
	const user = requireAdmin(locals);
	const taxes = await db
		.select({
			name: businessTaxes.name,
			rateMilliPct: businessTaxes.rateMilliPct
		})
		.from(businessTaxes)
		.where(eq(businessTaxes.businessId, user.businessId))
		.orderBy(asc(businessTaxes.position));
	const [business] = await db
		.select({
			name: businesses.name,
			contactEmail: businesses.contactEmail,
			contactPhone: businesses.contactPhone,
			addressLine1: businesses.addressLine1,
			addressLine2: businesses.addressLine2,
			city: businesses.city,
			region: businesses.region,
			postalCode: businesses.postalCode,
			country: businesses.country
		})
		.from(businesses)
		.where(eq(businesses.id, user.businessId));
	return { businessInfo: business, taxes };
};

export const actions: Actions = {
	saveTaxes: async ({ locals, request }) => {
		const user = requireAdmin(locals);
		const form = await request.formData();

		let parsed: unknown;
		try {
			parsed = JSON.parse(String(form.get('taxes') ?? ''));
		} catch {
			return fail(400, { taxMessage: 'Invalid tax data.' });
		}
		if (!Array.isArray(parsed) || parsed.length > TAX_LIMITS.count) {
			return fail(400, { taxMessage: `Up to ${TAX_LIMITS.count} tax lines are supported.` });
		}

		const lines: { name: string; rateMilliPct: number }[] = [];
		for (const entry of parsed) {
			const name = String((entry as { name?: unknown }).name ?? '').trim();
			const rate = parseTaxRate(String((entry as { rate?: unknown }).rate ?? ''));
			if (!name || name.length > TAX_LIMITS.name) {
				return fail(400, { taxMessage: 'Every tax needs a name (max 20 characters).' });
			}
			if (rate === null) {
				return fail(400, {
					taxMessage: `"${name}" needs a rate between 0 and 50% (up to 3 decimals).`
				});
			}
			lines.push({ name, rateMilliPct: rate });
		}

		await db.delete(businessTaxes).where(eq(businessTaxes.businessId, user.businessId));
		if (lines.length) {
			await db.insert(businessTaxes).values(
				lines.map((line, position) => ({
					businessId: user.businessId,
					name: line.name,
					rateMilliPct: line.rateMilliPct,
					position
				}))
			);
		}
		return { taxesSaved: true };
	},

	saveInfo: async ({ locals, request }) => {
		const user = requireAdmin(locals);
		const form = await request.formData();
		const name = String(form.get('name') ?? '').trim();
		if (!name) return fail(400, { message: 'Business name is required.' });

		await db
			.update(businesses)
			.set({
				name,
				contactEmail: String(form.get('contactEmail') ?? '').trim() || null,
				contactPhone: String(form.get('contactPhone') ?? '').trim() || null,
				addressLine1: String(form.get('addressLine1') ?? '').trim() || null,
				addressLine2: String(form.get('addressLine2') ?? '').trim() || null,
				city: String(form.get('city') ?? '').trim() || null,
				region: String(form.get('region') ?? '').trim() || null,
				postalCode: String(form.get('postalCode') ?? '').trim() || null,
				country: String(form.get('country') ?? '').trim() || null
			})
			.where(eq(businesses.id, user.businessId));

		return { saved: true };
	}
};
