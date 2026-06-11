<script lang="ts">
	import { enhance } from '$app/forms';
	import Icon from '$lib/components/Icon.svelte';
	import { formatCents } from '$lib/pricing/engine';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	const isAdmin = $derived(data.user.role === 'admin');
	let creating = $state(false);
</script>

<svelte:head>
	<title>Price sheets — EzEval</title>
</svelte:head>

<div class="mb-5 flex items-center justify-between">
	<h1 class="heading-display text-3xl">Price sheets</h1>
</div>

{#if form && 'message' in form && form.message}
	<p class="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
		{form.message}
	</p>
{/if}

<div class="grid gap-4 sm:grid-cols-2">
	{#each data.sheets as sheet (sheet.id)}
		<div class="card flex flex-col p-5">
			<div class="flex items-start justify-between gap-2">
				<h2 class="font-display text-2xl font-semibold tracking-wide">{sheet.name}</h2>
				{#if sheet.isDefault}
					<span class="badge bg-glass-100 text-glass-800">Default</span>
				{/if}
			</div>
			<div class="text-ink-500 mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm">
				<span>
					{sheet.estimatorVisibility === 'metrics_only' ? 'Metrics only' : 'Grand total'} for field
					staff
				</span>
				{#if sheet.minimumCents !== undefined && sheet.minimumCents > 0}
					<span class="num font-normal">min {formatCents(sheet.minimumCents)}</span>
				{/if}
				{#if sheet.setupFeeEnabled}
					<span>setup fee auto</span>
				{/if}
			</div>
			<div class="mt-4 flex gap-2">
				<a href="/app/evaluate/{sheet.id}" class="btn-primary flex-1">New evaluation</a>
				{#if isAdmin}
					<a href="/app/sheets/{sheet.id}/edit" class="btn-outline" aria-label="Edit {sheet.name}">
						<Icon name="edit" size={20} />
					</a>
					<form
						method="POST"
						action="?/archive"
						use:enhance={({ cancel }) => {
							if (!confirm(`Archive "${sheet.name}"? Past quotes are kept.`)) cancel();
						}}
					>
						<input type="hidden" name="id" value={sheet.id} />
						<button type="submit" class="btn-ghost" aria-label="Archive {sheet.name}">
							<Icon name="trash" size={20} />
						</button>
					</form>
				{/if}
			</div>
		</div>
	{:else}
		<div class="card p-8 text-center text-ink-500 sm:col-span-2">
			No price sheets yet{isAdmin ? ' — create one below.' : '. Ask your admin to set one up.'}
		</div>
	{/each}
</div>

{#if isAdmin}
	<div class="card mt-6 p-5">
		<h2 class="heading-display text-lg">New price sheet</h2>
		<p class="text-ink-500 mt-0.5 text-sm">
			e.g. Commercial, Post-construction — each sheet has its own buttons, prices, and rules.
		</p>
		<form
			method="POST"
			action="?/create"
			class="mt-3 flex gap-2"
			use:enhance={() => {
				creating = true;
				return async ({ update }) => {
					creating = false;
					await update();
				};
			}}
		>
			<input
				name="name"
				type="text"
				required
				maxlength="60"
				placeholder="Sheet name"
				class="field flex-1"
			/>
			<button type="submit" disabled={creating} class="btn-dark">
				<Icon name="plus" size={20} />
				Create
			</button>
		</form>
	</div>
{/if}
