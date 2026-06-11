import { fail } from '@sveltejs/kit';
import { and, asc, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { workflowSteps, workflowTemplates } from '$lib/server/db/schema';
import { requireAdmin } from '$lib/server/guard';
import type { Actions, PageServerLoad } from './$types';

const LIMITS = { steps: 20, label: 120, name: 60 };

export const load: PageServerLoad = async ({ locals }) => {
	const user = requireAdmin(locals);
	const templates = await db
		.select()
		.from(workflowTemplates)
		.where(eq(workflowTemplates.businessId, user.businessId))
		.orderBy(asc(workflowTemplates.createdAt));
	const steps = await db
		.select({
			id: workflowSteps.id,
			templateId: workflowSteps.templateId,
			label: workflowSteps.label,
			position: workflowSteps.position
		})
		.from(workflowSteps)
		.innerJoin(workflowTemplates, eq(workflowSteps.templateId, workflowTemplates.id))
		.where(eq(workflowTemplates.businessId, user.businessId))
		.orderBy(asc(workflowSteps.position));

	return {
		templates: templates.map((t) => ({
			id: t.id,
			name: t.name,
			isDefault: t.isDefault,
			steps: steps.filter((s) => s.templateId === t.id)
		}))
	};
};

async function ownedTemplate(businessId: string, id: string) {
	const [template] = await db
		.select({ id: workflowTemplates.id })
		.from(workflowTemplates)
		.where(and(eq(workflowTemplates.id, id), eq(workflowTemplates.businessId, businessId)));
	return template ?? null;
}

export const actions: Actions = {
	create: async ({ locals, request }) => {
		const user = requireAdmin(locals);
		const form = await request.formData();
		const name = String(form.get('name') ?? '').trim();
		if (!name || name.length > LIMITS.name) {
			return fail(400, { message: 'Workflow name is required (max 60 chars).' });
		}
		await db.insert(workflowTemplates).values({ businessId: user.businessId, name });
		return { ok: true };
	},

	save: async ({ locals, request }) => {
		const user = requireAdmin(locals);
		const form = await request.formData();
		const id = String(form.get('id') ?? '');
		if (!(await ownedTemplate(user.businessId, id))) {
			return fail(404, { message: 'Workflow not found.' });
		}

		let steps: unknown;
		try {
			steps = JSON.parse(String(form.get('steps') ?? ''));
		} catch {
			return fail(400, { message: 'Invalid steps.' });
		}
		if (!Array.isArray(steps) || steps.length > LIMITS.steps) {
			return fail(400, { message: `Workflows support up to ${LIMITS.steps} steps.` });
		}
		const labels = steps.map((s) => String(s).trim()).filter(Boolean);
		if (labels.some((l) => l.length > LIMITS.label)) {
			return fail(400, { message: 'Step text is too long.' });
		}

		await db.delete(workflowSteps).where(eq(workflowSteps.templateId, id));
		if (labels.length) {
			await db
				.insert(workflowSteps)
				.values(labels.map((label, position) => ({ templateId: id, label, position })));
		}
		return { ok: true };
	},

	makeDefault: async ({ locals, request }) => {
		const user = requireAdmin(locals);
		const form = await request.formData();
		const id = String(form.get('id') ?? '');
		if (!(await ownedTemplate(user.businessId, id))) {
			return fail(404, { message: 'Workflow not found.' });
		}
		await db
			.update(workflowTemplates)
			.set({ isDefault: false })
			.where(eq(workflowTemplates.businessId, user.businessId));
		await db.update(workflowTemplates).set({ isDefault: true }).where(eq(workflowTemplates.id, id));
		return { ok: true };
	},

	delete: async ({ locals, request }) => {
		const user = requireAdmin(locals);
		const form = await request.formData();
		const id = String(form.get('id') ?? '');
		await db
			.delete(workflowTemplates)
			.where(and(eq(workflowTemplates.id, id), eq(workflowTemplates.businessId, user.businessId)));
		return { ok: true };
	}
};
