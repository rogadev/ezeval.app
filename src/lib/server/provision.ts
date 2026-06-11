import { db } from './db';
import {
	priceSheets,
	priceSheetRows,
	priceSheetButtons,
	workflowTemplates,
	workflowSteps
} from './db/schema';

/**
 * The founder's original 2021 reference sheet (spec §4.2), recovered from the
 * old app's default_pricing.js. Setup is not a button: the default sheet uses
 * the auto-attaching setup fee ($22.50) so nobody has to remember to tap it.
 */
const DEFAULT_SHEET = {
	name: 'Residential',
	setupFeeEnabled: true,
	setupFeeCents: 2250,
	estimatorVisibility: 'grand_total' as const,
	minimumCents: 15000,
	rows: [
		{
			label: 'Special',
			buttons: [
				{ label: 'Skylight', priceCents: 1800, pricingUnit: 'flat' as const },
				{ label: 'French', priceCents: 100, pricingUnit: 'per_unit' as const }
			]
		},
		{
			label: 'High Level',
			buttons: [
				{ label: 'Small', priceCents: 500, pricingUnit: 'flat' as const },
				{ label: 'Medium', priceCents: 600, pricingUnit: 'flat' as const },
				{ label: 'Large', priceCents: 700, pricingUnit: 'flat' as const }
			]
		},
		{
			label: 'Mid Level',
			buttons: [
				{ label: 'Small', priceCents: 400, pricingUnit: 'flat' as const },
				{ label: 'Medium', priceCents: 500, pricingUnit: 'flat' as const },
				{ label: 'Large', priceCents: 600, pricingUnit: 'flat' as const }
			]
		},
		{
			label: 'Ground Level',
			buttons: [
				{ label: 'Small', priceCents: 300, pricingUnit: 'flat' as const },
				{ label: 'Medium', priceCents: 400, pricingUnit: 'flat' as const },
				{ label: 'Large', priceCents: 550, pricingUnit: 'flat' as const }
			]
		}
	]
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
}
