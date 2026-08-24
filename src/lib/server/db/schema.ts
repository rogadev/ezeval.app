import {
	pgTable,
	pgEnum,
	text,
	timestamp,
	boolean,
	integer,
	date,
	doublePrecision,
	index
} from 'drizzle-orm/pg-core';

const id = () =>
	text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID());

const createdAt = () => timestamp('created_at').defaultNow().notNull();
const updatedAt = () =>
	timestamp('updated_at')
		.defaultNow()
		.$onUpdate(() => new Date())
		.notNull();

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const userRole = pgEnum('user_role', ['admin', 'estimator', 'technician']);

/**
 * Per-sheet anti-leakage mode for non-admin users (spec §4.5):
 * - metrics_only: field worker sees no dollar amounts at all
 * - grand_total: field worker sees only the final total (floored at the
 *   sheet minimum), never per-button prices
 */
export const estimatorVisibility = pgEnum('estimator_visibility', ['metrics_only', 'grand_total']);

/** flat = price per tap; per_unit = price per counted unit (e.g. $1/French pane) */
export const pricingUnit = pgEnum('pricing_unit', ['flat', 'per_unit']);

export const jobStatus = pgEnum('job_status', [
	'scheduled',
	'in_progress',
	'completed',
	'canceled'
]);

export const evaluationStatus = pgEnum('evaluation_status', ['draft', 'completed']);

// ---------------------------------------------------------------------------
// Tenancy
// ---------------------------------------------------------------------------

export const businesses = pgTable('businesses', {
	id: id(),
	name: text('name').notNull(),
	// Contact/business info captured now so future invoicing (spec §8) can
	// pre-populate outbound documents.
	contactEmail: text('contact_email'),
	contactPhone: text('contact_phone'),
	addressLine1: text('address_line1'),
	addressLine2: text('address_line2'),
	city: text('city'),
	region: text('region'),
	postalCode: text('postal_code'),
	country: text('country'),
	// Stripe subscription state (spec §6), maintained by webhook.
	stripeCustomerId: text('stripe_customer_id').unique(),
	stripeSubscriptionId: text('stripe_subscription_id'),
	subscriptionStatus: text('subscription_status'), // Stripe status string, null = never subscribed
	trialEndsAt: timestamp('trial_ends_at'),
	// Comped businesses get full paid access without a Stripe subscription
	// (owner demo/showcase account, internal use). Excluded from paying-user
	// and revenue metrics so the numbers stay honest.
	comped: boolean('comped').default(false).notNull(),
	createdAt: createdAt(),
	updatedAt: updatedAt()
});

/**
 * Per-business sales tax profile (e.g. GST 5%, PST 7%, or a single HST line).
 * Rates are stored as integer milli-percent (5% = 5000, 9.975% = 9975) so
 * three-decimal rates like Quebec's QST stay exact. Taxes apply in parallel
 * (Canadian style), not compounded.
 */
export const businessTaxes = pgTable(
	'business_taxes',
	{
		id: id(),
		businessId: text('business_id')
			.notNull()
			.references(() => businesses.id, { onDelete: 'cascade' }),
		name: text('name').notNull(),
		rateMilliPct: integer('rate_milli_pct').notNull(),
		position: integer('position').notNull()
	},
	(table) => [index('business_taxes_business_idx').on(table.businessId)]
);

// ---------------------------------------------------------------------------
// Better Auth core tables (+ tenant fields on user)
// ---------------------------------------------------------------------------

export const user = pgTable('user', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	email: text('email').notNull().unique(),
	emailVerified: boolean('email_verified').default(false).notNull(),
	image: text('image'),
	// Tenant fields. businessId is null only for the instant between Better
	// Auth creating the user and our signup flow attaching the business.
	businessId: text('business_id').references(() => businesses.id, { onDelete: 'cascade' }),
	role: userRole('role').default('admin').notNull(),
	createdAt: createdAt(),
	updatedAt: updatedAt()
});

export const session = pgTable(
	'session',
	{
		id: text('id').primaryKey(),
		expiresAt: timestamp('expires_at').notNull(),
		token: text('token').notNull().unique(),
		createdAt: createdAt(),
		updatedAt: updatedAt(),
		ipAddress: text('ip_address'),
		userAgent: text('user_agent'),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' })
	},
	(table) => [index('session_user_id_idx').on(table.userId)]
);

export const account = pgTable(
	'account',
	{
		id: text('id').primaryKey(),
		accountId: text('account_id').notNull(),
		providerId: text('provider_id').notNull(),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		accessToken: text('access_token'),
		refreshToken: text('refresh_token'),
		idToken: text('id_token'),
		accessTokenExpiresAt: timestamp('access_token_expires_at'),
		refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
		scope: text('scope'),
		password: text('password'),
		createdAt: createdAt(),
		updatedAt: updatedAt()
	},
	(table) => [index('account_user_id_idx').on(table.userId)]
);

export const verification = pgTable(
	'verification',
	{
		id: text('id').primaryKey(),
		identifier: text('identifier').notNull(),
		value: text('value').notNull(),
		expiresAt: timestamp('expires_at').notNull(),
		createdAt: createdAt(),
		updatedAt: updatedAt()
	},
	(table) => [index('verification_identifier_idx').on(table.identifier)]
);

/** Admin-generated invite links that enroll estimators/technicians into a business. */
export const invitations = pgTable('invitations', {
	id: id(),
	token: text('token').notNull().unique(),
	businessId: text('business_id')
		.notNull()
		.references(() => businesses.id, { onDelete: 'cascade' }),
	role: userRole('role').notNull(),
	email: text('email'),
	expiresAt: timestamp('expires_at').notNull(),
	acceptedAt: timestamp('accepted_at'),
	acceptedBy: text('accepted_by').references(() => user.id),
	createdAt: createdAt()
});

// ---------------------------------------------------------------------------
// Price sheets (spec §4)
// ---------------------------------------------------------------------------

export const priceSheets = pgTable(
	'price_sheets',
	{
		id: id(),
		businessId: text('business_id')
			.notNull()
			.references(() => businesses.id, { onDelete: 'cascade' }),
		name: text('name').notNull(),
		setupFeeEnabled: boolean('setup_fee_enabled').default(false).notNull(),
		setupFeeCents: integer('setup_fee_cents').default(0).notNull(),
		estimatorVisibility: estimatorVisibility('estimator_visibility')
			.default('grand_total')
			.notNull(),
		/** Displayed totals never fall below this floor (anti-reverse-engineering, spec §4.5). */
		minimumCents: integer('minimum_cents').default(0).notNull(),
		isDefault: boolean('is_default').default(false).notNull(),
		archived: boolean('archived').default(false).notNull(),
		createdAt: createdAt(),
		updatedAt: updatedAt()
	},
	(table) => [index('price_sheets_business_id_idx').on(table.businessId)]
);

/** A row groups buttons by access level (Special / High / Mid / Ground by default). */
export const priceSheetRows = pgTable(
	'price_sheet_rows',
	{
		id: id(),
		priceSheetId: text('price_sheet_id')
			.notNull()
			.references(() => priceSheets.id, { onDelete: 'cascade' }),
		label: text('label').notNull(),
		position: integer('position').notNull()
	},
	(table) => [index('price_sheet_rows_sheet_idx').on(table.priceSheetId)]
);

export const priceSheetButtons = pgTable(
	'price_sheet_buttons',
	{
		id: id(),
		rowId: text('row_id')
			.notNull()
			.references(() => priceSheetRows.id, { onDelete: 'cascade' }),
		label: text('label').notNull(),
		priceCents: integer('price_cents').default(0).notNull(),
		pricingUnit: pricingUnit('pricing_unit').default('flat').notNull(),
		position: integer('position').notNull()
	},
	(table) => [index('price_sheet_buttons_row_idx').on(table.rowId)]
);

// ---------------------------------------------------------------------------
// CRM (spec §5)
// ---------------------------------------------------------------------------

export const customers = pgTable(
	'customers',
	{
		id: id(),
		businessId: text('business_id')
			.notNull()
			.references(() => businesses.id, { onDelete: 'cascade' }),
		name: text('name').notNull(),
		email: text('email'),
		phone: text('phone'),
		addressLine1: text('address_line1'),
		addressLine2: text('address_line2'),
		city: text('city'),
		region: text('region'),
		postalCode: text('postal_code'),
		lat: doublePrecision('lat'),
		lng: doublePrecision('lng'),
		propertyNotes: text('property_notes'),
		/** First-class field (spec §5.2): dogs, goats, horses — anything field staff must know. */
		animalNotes: text('animal_notes'),
		createdAt: createdAt(),
		updatedAt: updatedAt()
	},
	(table) => [index('customers_business_id_idx').on(table.businessId)]
);

export const workflowTemplates = pgTable(
	'workflow_templates',
	{
		id: id(),
		businessId: text('business_id')
			.notNull()
			.references(() => businesses.id, { onDelete: 'cascade' }),
		name: text('name').notNull(),
		isDefault: boolean('is_default').default(false).notNull(),
		createdAt: createdAt()
	},
	(table) => [index('workflow_templates_business_idx').on(table.businessId)]
);

export const workflowSteps = pgTable(
	'workflow_steps',
	{
		id: id(),
		templateId: text('template_id')
			.notNull()
			.references(() => workflowTemplates.id, { onDelete: 'cascade' }),
		label: text('label').notNull(),
		position: integer('position').notNull()
	},
	(table) => [index('workflow_steps_template_idx').on(table.templateId)]
);

/**
 * An estimation appointment ("task" in the spec; named jobs to avoid clashing
 * with the generic word everywhere). A day's jobs for one assignee form a run.
 */
export const jobs = pgTable(
	'jobs',
	{
		id: id(),
		businessId: text('business_id')
			.notNull()
			.references(() => businesses.id, { onDelete: 'cascade' }),
		customerId: text('customer_id')
			.notNull()
			.references(() => customers.id, { onDelete: 'cascade' }),
		assigneeId: text('assignee_id').references(() => user.id, { onDelete: 'set null' }),
		priceSheetId: text('price_sheet_id').references(() => priceSheets.id, {
			onDelete: 'set null'
		}),
		scheduledDate: date('scheduled_date'),
		/**
		 * 'HH:MM' when the customer asked for a specific time (fixed appointment —
		 * anchors the schedule); null = flexible, worked into the day (spec §5.3).
		 */
		fixedTime: text('fixed_time'),
		status: jobStatus('status').default('scheduled').notNull(),
		notes: text('notes'),
		/** Position in the optimized route for the day (spec §5.5). */
		routeOrder: integer('route_order'),
		createdAt: createdAt(),
		updatedAt: updatedAt()
	},
	(table) => [
		index('jobs_business_id_idx').on(table.businessId),
		index('jobs_assignee_date_idx').on(table.assigneeId, table.scheduledDate)
	]
);

/** Workflow steps snapshotted onto a job at creation, checked off in the field (spec §5.4). */
export const jobWorkflowItems = pgTable(
	'job_workflow_items',
	{
		id: id(),
		jobId: text('job_id')
			.notNull()
			.references(() => jobs.id, { onDelete: 'cascade' }),
		label: text('label').notNull(),
		position: integer('position').notNull(),
		completedAt: timestamp('completed_at')
	},
	(table) => [index('job_workflow_items_job_idx').on(table.jobId)]
);

// ---------------------------------------------------------------------------
// Evaluations (spec §4.5) — line items snapshot button data so later sheet
// edits never alter past quotes (required for future invoicing, spec §8).
// ---------------------------------------------------------------------------

export const evaluations = pgTable(
	'evaluations',
	{
		id: id(),
		businessId: text('business_id')
			.notNull()
			.references(() => businesses.id, { onDelete: 'cascade' }),
		priceSheetId: text('price_sheet_id').references(() => priceSheets.id, {
			onDelete: 'set null'
		}),
		priceSheetName: text('price_sheet_name').notNull(),
		jobId: text('job_id').references(() => jobs.id, { onDelete: 'set null' }),
		customerId: text('customer_id').references(() => customers.id, { onDelete: 'set null' }),
		createdBy: text('created_by').references(() => user.id, { onDelete: 'set null' }),
		status: evaluationStatus('status').default('completed').notNull(),
		setupFeeCents: integer('setup_fee_cents').default(0).notNull(),
		subtotalCents: integer('subtotal_cents').notNull(),
		/** True when the sheet minimum overrode the computed total. */
		minimumApplied: boolean('minimum_applied').default(false).notNull(),
		totalCents: integer('total_cents').notNull(),
		notes: text('notes'),
		createdAt: createdAt(),
		updatedAt: updatedAt()
	},
	(table) => [
		index('evaluations_business_id_idx').on(table.businessId),
		index('evaluations_created_by_idx').on(table.createdBy)
	]
);

/** Tax lines snapshotted at save time so later tax-profile edits never alter past quotes. */
export const evaluationTaxes = pgTable(
	'evaluation_taxes',
	{
		id: id(),
		evaluationId: text('evaluation_id')
			.notNull()
			.references(() => evaluations.id, { onDelete: 'cascade' }),
		name: text('name').notNull(),
		rateMilliPct: integer('rate_milli_pct').notNull(),
		amountCents: integer('amount_cents').notNull(),
		position: integer('position').notNull()
	},
	(table) => [index('evaluation_taxes_evaluation_idx').on(table.evaluationId)]
);

export const evaluationItems = pgTable(
	'evaluation_items',
	{
		id: id(),
		evaluationId: text('evaluation_id')
			.notNull()
			.references(() => evaluations.id, { onDelete: 'cascade' }),
		buttonId: text('button_id').references(() => priceSheetButtons.id, { onDelete: 'set null' }),
		/** Snapshots: the metrics capture of {level/height, item, count} (spec §4.5). */
		rowLabel: text('row_label').notNull(),
		buttonLabel: text('button_label').notNull(),
		pricingUnit: pricingUnit('pricing_unit').default('flat').notNull(),
		unitPriceCents: integer('unit_price_cents').notNull(),
		quantity: integer('quantity').notNull(),
		lineTotalCents: integer('line_total_cents').notNull(),
		position: integer('position').notNull()
	},
	(table) => [index('evaluation_items_evaluation_idx').on(table.evaluationId)]
);
