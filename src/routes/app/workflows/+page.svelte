<script lang="ts">
	import { enhance } from '$app/forms';
	import Icon from '$lib/components/Icon.svelte';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	// Per-template draft steps, seeded from server data on each load.
	let drafts = $state<Record<string, string[]>>({});
	$effect(() => {
		const next: Record<string, string[]> = {};
		for (const template of data.templates) {
			next[template.id] = template.steps.map((s) => s.label);
		}
		drafts = next;
	});
</script>

<svelte:head>
	<title>Workflows — EzEval</title>
</svelte:head>

<h1 class="heading-display text-3xl">Workflows</h1>
<p class="text-ink-500 mt-1 max-w-2xl text-sm">
	The steps your field staff must follow on every estimation visit — calling ahead, checking for
	animals, confirming the quote. Steps appear as a checklist on each job.
</p>

{#if form?.message}
	<p class="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{form.message}</p>
{/if}

<div class="mt-5 space-y-5">
	{#each data.templates as template (template.id)}
		<div class="card p-5">
			<div class="flex flex-wrap items-center justify-between gap-2">
				<h2 class="font-display text-xl font-semibold tracking-wide">{template.name}</h2>
				<div class="flex items-center gap-2">
					{#if template.isDefault}
						<span class="badge bg-glass-100 text-glass-800">Default for new jobs</span>
					{:else}
						<form method="POST" action="?/makeDefault" use:enhance>
							<input type="hidden" name="id" value={template.id} />
							<button type="submit" class="btn-ghost min-h-10 px-3 text-sm">Make default</button>
						</form>
						<form
							method="POST"
							action="?/delete"
							use:enhance={({ cancel }) => {
								if (!confirm(`Delete "${template.name}"?`)) cancel();
							}}
						>
							<input type="hidden" name="id" value={template.id} />
							<button type="submit" class="btn-ghost min-h-10 px-3 text-red-600" aria-label="Delete workflow">
								<Icon name="trash" size={18} />
							</button>
						</form>
					{/if}
				</div>
			</div>

			{#if drafts[template.id]}
				<form method="POST" action="?/save" class="mt-3 space-y-2" use:enhance>
					<input type="hidden" name="id" value={template.id} />
					<input type="hidden" name="steps" value={JSON.stringify(drafts[template.id])} />
					{#each drafts[template.id] as step, index (index)}
						<div class="flex items-center gap-2">
							<span class="num text-ink-400 w-6 text-center">{index + 1}</span>
							<input
								type="text"
								bind:value={drafts[template.id][index]}
								maxlength="120"
								class="field flex-1"
							/>
							<button
								type="button"
								class="text-ink-400 p-2 hover:text-red-600"
								onclick={() => drafts[template.id].splice(index, 1)}
								aria-label="Remove step"
							>
								<Icon name="x" size={18} />
							</button>
						</div>
					{/each}
					<div class="flex items-center justify-between gap-2 pt-1">
						<button
							type="button"
							class="btn-outline border-dashed"
							onclick={() => drafts[template.id].push('')}
						>
							<Icon name="plus" size={18} />
							Add step
						</button>
						<button type="submit" class="btn-primary">Save steps</button>
					</div>
				</form>
			{/if}
		</div>
	{/each}
</div>

<form method="POST" action="?/create" class="card mt-6 flex gap-2 p-5" use:enhance>
	<input
		name="name"
		type="text"
		required
		maxlength="60"
		placeholder="New workflow name (e.g. Commercial visits)"
		class="field flex-1"
	/>
	<button type="submit" class="btn-dark">
		<Icon name="plus" size={20} />
		Create
	</button>
</form>
