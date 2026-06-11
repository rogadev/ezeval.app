<script lang="ts">
	import { enhance } from '$app/forms';
	import Icon from '$lib/components/Icon.svelte';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	const isAdmin = $derived(data.user.role === 'admin');

	const address = $derived(
		[
			data.customer.addressLine1,
			data.customer.addressLine2,
			data.customer.city,
			data.customer.region
		]
			.filter(Boolean)
			.join(', ')
	);
	const directionsUrl = $derived(
		`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`
	);
	const doneCount = $derived(data.checklist.filter((s) => s.completedAt).length);

	const statusStyle: Record<string, string> = {
		scheduled: 'bg-ink-100 text-ink-700',
		in_progress: 'bg-brand-100 text-brand-900',
		completed: 'bg-glass-100 text-glass-800',
		canceled: 'bg-red-50 text-red-700'
	};
</script>

<svelte:head>
	<title>Job · {data.customer.name} — EzEval</title>
</svelte:head>

<a
	href="/app/tasks"
	class="text-ink-500 hover:text-ink-800 mb-3 inline-flex items-center gap-1 text-sm font-medium"
>
	<Icon name="back" size={16} />
	Jobs
</a>

{#if form?.message}
	<p class="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{form.message}</p>
{/if}

<div class="flex flex-wrap items-center justify-between gap-2">
	<h1 class="heading-display text-3xl">{data.customer.name}</h1>
	<span class="badge {statusStyle[data.job.status]}">{data.job.status.replace('_', ' ')}</span>
</div>
<p class="text-ink-500 mt-1 text-sm">
	{data.job.scheduledDate ?? 'Unscheduled'}
	{#if data.job.fixedTime}<span class="num">@ {data.job.fixedTime}</span> (fixed appointment)
	{:else if data.job.scheduledDate}· flexible — work into the day{/if}
	{#if data.job.assigneeName}· {data.job.assigneeName}{/if}
</p>

<!-- Animal warning: the first thing a field worker must see -->
{#if data.customer.animalNotes}
	<p class="chip-hazard mt-4 w-full !text-base">
		<Icon name="paw" size={22} />
		{data.customer.animalNotes}
	</p>
{/if}

<div class="mt-5 grid gap-4 lg:grid-cols-2">
	<!-- Where & who -->
	<div class="card space-y-3 p-5">
		<h2 class="heading-display text-lg">Property</h2>
		{#if address}
			<p class="font-medium">{address}</p>
			<a href={directionsUrl} target="_blank" rel="noopener" class="btn-outline w-full">
				<Icon name="pin" size={18} />
				Directions
			</a>
		{:else}
			<p class="text-ink-400 text-sm">No address on file.</p>
		{/if}
		{#if data.customer.phone}
			<a href="tel:{data.customer.phone}" class="btn-outline w-full">
				<Icon name="phone" size={18} />
				Call {data.customer.name.split(' ')[0]} · {data.customer.phone}
			</a>
		{/if}
		{#if data.customer.propertyNotes}
			<div>
				<p class="field-label mb-1">Property notes</p>
				<p class="text-ink-700 text-sm whitespace-pre-wrap">{data.customer.propertyNotes}</p>
			</div>
		{/if}
		{#if data.job.notes}
			<div>
				<p class="field-label mb-1">Job notes</p>
				<p class="text-ink-700 text-sm whitespace-pre-wrap">{data.job.notes}</p>
			</div>
		{/if}
		<a href="/app/customers/{data.customer.id}" class="text-ink-500 text-sm underline">
			Customer record
		</a>
	</div>

	<!-- Workflow checklist -->
	<div class="card p-5">
		<div class="flex items-center justify-between">
			<h2 class="heading-display text-lg">Workflow</h2>
			{#if data.checklist.length}
				<span class="num text-ink-400 text-sm">{doneCount}/{data.checklist.length}</span>
			{/if}
		</div>
		{#if data.checklist.length === 0}
			<p class="text-ink-400 mt-2 text-sm">No workflow steps on this job.</p>
		{:else}
			<ul class="mt-2 space-y-1">
				{#each data.checklist as step (step.id)}
					<li>
						<form method="POST" action="?/toggleStep" use:enhance>
							<input type="hidden" name="stepId" value={step.id} />
							<button
								type="submit"
								class="hover:bg-ink-50 flex min-h-12 w-full items-center gap-3 rounded-lg px-2 text-left"
							>
								<span
									class="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2
										{step.completedAt ? 'border-glass-600 bg-glass-600 text-white' : 'border-ink-300 bg-white'}"
								>
									{#if step.completedAt}<Icon name="check" size={15} />{/if}
								</span>
								<span class={step.completedAt ? 'text-ink-400 line-through' : 'font-medium'}>
									{step.label}
								</span>
							</button>
						</form>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</div>

<!-- Primary action -->
<div class="mt-5">
	{#if data.sheet}
		<a href="/app/evaluate/{data.sheet.id}?job={data.job.id}" class="btn-primary w-full text-lg">
			Start evaluation · {data.sheet.name}
		</a>
	{:else}
		<a href="/app/sheets" class="btn-primary w-full text-lg">Start evaluation</a>
	{/if}
</div>

<!-- Status controls -->
<div class="mt-4 flex flex-wrap gap-2">
	{#if data.job.status !== 'completed'}
		<form method="POST" action="?/setStatus" use:enhance>
			<input type="hidden" name="status" value="completed" />
			<button type="submit" class="btn-outline">
				<Icon name="check" size={18} />
				Mark complete
			</button>
		</form>
	{/if}
	{#if data.job.status !== 'canceled'}
		<form method="POST" action="?/setStatus" use:enhance>
			<input type="hidden" name="status" value="canceled" />
			<button type="submit" class="btn-ghost text-red-600">Cancel job</button>
		</form>
	{:else}
		<form method="POST" action="?/setStatus" use:enhance>
			<input type="hidden" name="status" value="scheduled" />
			<button type="submit" class="btn-outline">Re-open</button>
		</form>
	{/if}
	{#if isAdmin}
		<form
			method="POST"
			action="?/delete"
			use:enhance={({ cancel }) => {
				if (!confirm('Delete this job?')) cancel();
			}}
			class="ml-auto"
		>
			<button type="submit" class="btn-ghost text-red-600">
				<Icon name="trash" size={18} />
				Delete
			</button>
		</form>
	{/if}
</div>
