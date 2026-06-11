<script lang="ts">
	import { enhance } from '$app/forms';
	import Icon from '$lib/components/Icon.svelte';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	const isAdmin = $derived(data.createOptions !== null);
	let adding = $state(false);
	let search = $state('');

	const filtered = $derived.by(() => {
		const query = search.trim().toLowerCase();
		if (!query) return data.jobs;
		return data.jobs.filter((job) =>
			[job.customerName, job.customerCity, job.assigneeName, job.scheduledDate, job.status]
				.filter(Boolean)
				.some((value) => value!.toLowerCase().includes(query))
		);
	});

	const statusStyle: Record<string, string> = {
		scheduled: 'bg-ink-100 text-ink-700',
		in_progress: 'bg-brand-100 text-brand-900',
		completed: 'bg-glass-100 text-glass-800',
		canceled: 'bg-red-50 text-red-700'
	};
</script>

<svelte:head>
	<title>Jobs — EzEval</title>
</svelte:head>

<div class="mb-5 flex items-center justify-between gap-3">
	<h1 class="heading-display text-3xl">Estimation jobs</h1>
	{#if isAdmin}
		<button type="button" class="btn-primary" onclick={() => (adding = !adding)}>
			<Icon name={adding ? 'x' : 'plus'} size={20} />
			{adding ? 'Cancel' : 'New job'}
		</button>
	{/if}
</div>

{#if form?.message}
	<p class="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{form.message}</p>
{/if}

{#if adding && data.createOptions}
	<form method="POST" action="?/create" class="card mb-6 space-y-4 p-5" use:enhance>
		<h2 class="heading-display text-lg">New estimation job</h2>
		<div class="grid gap-4 sm:grid-cols-2">
			<div class="sm:col-span-2">
				<label for="j-customer" class="field-label">Customer</label>
				<select id="j-customer" name="customerId" required class="field">
					<option value="">— Pick a customer —</option>
					{#each data.createOptions.customers as customer (customer.id)}
						<option value={customer.id}>{customer.name}</option>
					{/each}
				</select>
			</div>
			<div>
				<label for="j-assignee" class="field-label">Assign to</label>
				<select id="j-assignee" name="assigneeId" class="field">
					<option value="">— Unassigned —</option>
					{#each data.createOptions.members as member (member.id)}
						<option value={member.id}>{member.name} ({member.role})</option>
					{/each}
				</select>
			</div>
			<div>
				<label for="j-sheet" class="field-label">Price sheet</label>
				<select id="j-sheet" name="priceSheetId" class="field">
					<option value="">— Any —</option>
					{#each data.createOptions.sheets as sheet (sheet.id)}
						<option value={sheet.id}>{sheet.name}</option>
					{/each}
				</select>
			</div>
			<div>
				<label for="j-date" class="field-label">Date</label>
				<input id="j-date" name="scheduledDate" type="date" class="field" />
			</div>
			<div>
				<label for="j-time" class="field-label">
					Fixed time <span class="text-ink-400 normal-case">(blank = flexible)</span>
				</label>
				<input id="j-time" name="fixedTime" type="time" class="field" />
				<p class="text-ink-400 mt-1 text-xs">
					Customers don't need to be home — they just need to know you're coming.
				</p>
			</div>
			<div>
				<label for="j-workflow" class="field-label">Workflow</label>
				<select id="j-workflow" name="templateId" class="field">
					{#each data.createOptions.templates as template (template.id)}
						<option value={template.id} selected={template.isDefault}>{template.name}</option>
					{/each}
				</select>
			</div>
			<div class="sm:col-span-2">
				<label for="j-notes" class="field-label">Notes</label>
				<textarea id="j-notes" name="notes" rows="2" class="field"></textarea>
			</div>
		</div>
		<button type="submit" class="btn-dark w-full">Create job</button>
	</form>
{/if}

{#if data.jobs.length > 5}
	<input
		type="search"
		placeholder="Search jobs — customer, city, assignee, date…"
		bind:value={search}
		class="field mb-4"
		aria-label="Search jobs"
	/>
{/if}

{#if data.jobs.length === 0}
	<div class="card text-ink-500 p-8 text-center">
		{isAdmin
			? 'No jobs yet — create one to dispatch your team.'
			: 'Nothing assigned to you yet. Enjoy the sunshine.'}
	</div>
{:else if filtered.length === 0}
	<div class="card text-ink-500 p-8 text-center">No matches.</div>
{:else}
	<div class="card divide-ink-100 divide-y-2">
		{#each filtered as job (job.id)}
			<a href="/app/tasks/{job.id}" class="hover:bg-ink-50 flex items-center gap-3 px-4 py-3">
				<div class="min-w-0 flex-1">
					<p class="flex items-center gap-2 truncate font-semibold">
						{job.customerName}
						{#if job.animalNotes}
							<span class="chip-hazard !px-1.5 !py-0.5 !text-xs" title={job.animalNotes}>
								<Icon name="paw" size={13} />
							</span>
						{/if}
					</p>
					<p class="text-ink-400 truncate text-sm">
						{job.scheduledDate ?? 'Unscheduled'}
						{#if job.fixedTime}<span class="num">@ {job.fixedTime}</span>
						{:else if job.scheduledDate}· flexible{/if}
						{#if job.assigneeName}· {job.assigneeName}{/if}
					</p>
				</div>
				<span class="badge {statusStyle[job.status]}">{job.status.replace('_', ' ')}</span>
			</a>
		{/each}
	</div>
{/if}
