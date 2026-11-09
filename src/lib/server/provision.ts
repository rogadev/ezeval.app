import { SAMPLE_SHEET } from '$lib/pricing/sample-sheet';
import { db } from './db';
import {
	businessTaxes,
	priceSheets,
	priceSheetRows,
	priceSheetButtons,
	workflowTemplates,
	workflowSteps
} from './db/schema';

/** The starter sheet: the public sample sheet's prices, saved as the business's default. */
const DEFAULT_SHEET = {
	...SAMPLE_SHEET,
	name: 'Residential',
	estimatorVisibility: 'grand_total' as const
};

const DEFAULT_WORKFLOW = {
	name: 'Standard estimation visit',
	steps: [
		'Call the customer ~25 minutes before arrival',
		'Review property notes and animal warnings',
		'Complete the on-site evaluation',
		'Let the customer know the quote is on its way'
	]
};

/** Sets up the default price sheet and workflow template for a new business (spec §4.6). */
export async function provisionBusinessDefaults(businessId: string): Promise<void> {
	const [sheet] = await db
		.insert(priceSheets)
		.values({
			businessId,
			name: DEFAULT_SHEET.name,
			setupFeeEnabled: DEFAULT_SHEET.setupFeeEnabled,
			setupFeeCents: DEFAULT_SHEET.setupFeeCents,
			estimatorVisibility: DEFAULT_SHEET.estimatorVisibility,
			minimumCents: DEFAULT_SHEET.minimumCents,
			isDefault: true
		})
		.returning();

	for (const [rowIndex, row] of DEFAULT_SHEET.rows.entries()) {
		const [dbRow] = await db
			.insert(priceSheetRows)
			.values({ priceSheetId: sheet.id, label: row.label, position: rowIndex })
			.returning();
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

	const [template] = await db
		.insert(workflowTemplates)
		.values({ businessId, name: DEFAULT_WORKFLOW.name, isDefault: true })
		.returning();
	await db.insert(workflowSteps).values(
		DEFAULT_WORKFLOW.steps.map((label, index) => ({
			templateId: template.id,
			label,
			position: index
		}))
	);

	// Canadian default tax profile: GST 5% covers every province as a baseline;
	// owners add PST or swap to HST in Business settings.
	await db.insert(businessTaxes).values({
		businessId,
		name: 'GST',
		rateMilliPct: 5000,
		position: 0
	});
}
