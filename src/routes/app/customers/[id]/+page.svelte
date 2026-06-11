<script lang="ts">
	import { enhance } from '$app/forms';
	import CustomerFields from '$lib/components/CustomerFields.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import { formatCents } from '$lib/pricing/engine';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	const isAdmin = $derived(data.user.role === 'admin');
	let saving = $state(false);
	let savedFlash = $state(false);

	const dateFmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });
	const statusStyle: Record<string, string> = {
		scheduled: 'bg-ink-100 text-ink-700',
		in_progress: 'bg-brand-100 text-brand-900',
		completed: 'bg-glass-100 text-glass-800',
		canceled: 'bg-red-50 text-red-700'
	};
</script>

<svelte:head>
	<title>{data.customer.name} — EzEval</title>
</svelte:head>

<a
	href="/app/customers"
	class="text-ink-500 hover:text-ink-800 mb-3 inline-flex items-center gap-1 text-sm font-medium"
>
	<Icon name="back" size={16} />
	Customers
</a>

<div class="flex flex-wrap items-center justify-between gap-2">
	<h1 class="heading-display text-3xl">{data.customer.name}</h1>
	{#if !data.customer.mapped && data.customer.addressLine1}
		<span class="badge bg-ink-100 text-ink-600">Address not mapped yet</span>
	{/if}
</div>

{#if data.customer.animalNotes}
	<p class="chip-hazard mt-3">
		<Icon name="paw" size={18} />
		{data.customer.animalNotes}
	</p>
{/if}

<form
	method="POST"
	action="?/update"
	class="card mt-5 space-y-4 p-5"
	use:enhance={() => {
		saving = true;
		return async ({ update, result }) => {
			saving = false;
			await update({ reset: false });
			if (result.type === 'success') {
				savedFlash = true;
				setTimeout(() => (savedFlash = false), 2500);
			}
		};
	}}
>
	{#if form?.message}
		<p class="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{form.message}</p>
	{/if}
	<CustomerFields customer={data.customer} />
	<div class="flex items-center justify-between gap-3">
		{#if savedFlash}
			<span class="text-glass-700 flex items-center gap-1.5 font-semibold">
				<Icon name="check" size={20} />
				Saved
			</span>
		{:else}
			<span></span>
		{/if}
		<button type="submit" disabled={saving} class="btn-primary min-w-32">
			{saving ? 'Saving…' : 'Save changes'}
		</button>
	</div>
</form>

<div class="mt-6 grid gap-4 lg:grid-cols-2">
	<div class="card p-5">
		<h2 class="heading-display text-lg">Jobs</h2>
		{#if data.jobs.length === 0}
			<p class="text-ink-400 mt-2 text-sm">No estimation jobs yet.</p>
		{:else}
			<ul class="divide-ink-100 mt-2 divide-y">
				{#each data.jobs as job (job.id)}
					<li>
						<a
							href="/app/tasks/{job.id}"
							class="hover:bg-ink-50 flex items-center justify-between gap-2 py-2.5"
						>
							<span class="text-sm font-medium">
								{job.scheduledDate ?? 'Unscheduled'}
								{#if job.fixedTime}<span class="num">@ {job.fixedTime}</span>{/if}
							</span>
							<span class="badge {statusStyle[job.status]}">{job.status.replace('_', ' ')}</span>
						</a>
					</li>
				{/each}
			</ul>
		{/if}
	</div>

	<div class="card p-5">
		<h2 class="heading-display text-lg">Quotes</h2>
		{#if data.quotes.length === 0}
			<p class="text-ink-400 mt-2 text-sm">No evaluations yet.</p>
		{:else}
			<ul class="divide-ink-100 mt-2 divide-y">
				{#each data.quotes as quote (quote.id)}
					<li>
						<a
							href="/app/evaluations/{quote.id}"
							class="hover:bg-ink-50 flex items-center justify-between gap-2 py-2.5"
						>
							<span class="text-sm font-medium">{dateFmt.format(new Date(quote.createdAt))}</span>
							{#if quote.totalCents !== undefined}
								<span class="num text-glass-700">{formatCents(quote.totalCents)}</span>
							{/if}
						</a>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</div>

{#if isAdmin}
	<form
		method="POST"
		action="?/delete"
		class="mt-6"
		use:enhance={({ cancel }) => {
			if (!confirm(`Delete ${data.customer.name}? Their jobs are removed; saved quotes are kept.`))
				cancel();
		}}
	>
		<button type="submit" class="btn-danger w-full sm:w-auto">
			<Icon name="trash" size={18} />
			Delete customer
		</button>
	</form>
{/if}
