<script lang="ts">
	import { formatCents } from '$lib/pricing/engine';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let search = $state('');

	const dateFmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });

	const filtered = $derived.by(() => {
		const query = search.trim().toLowerCase();
		if (!query) return data.evaluations;
		return data.evaluations.filter((evaluation) =>
			[evaluation.customerName, evaluation.sheetName, evaluation.createdByName]
				.filter(Boolean)
				.some((value) => value!.toLowerCase().includes(query))
		);
	});
</script>

<svelte:head>
	<title>Quotes — EzEval</title>
</svelte:head>

<h1 class="heading-display mb-5 text-3xl">Quotes</h1>

{#if data.evaluations.length > 5}
	<input
		type="search"
		placeholder="Search quotes — customer, sheet, team member…"
		bind:value={search}
		class="field mb-4"
		aria-label="Search quotes"
	/>
{/if}

{#if data.evaluations.length === 0}
	<div class="card text-ink-500 p-8 text-center">
		No evaluations yet — open a <a href="/app/sheets" class="font-semibold underline">price sheet</a
		>
		and start tapping.
	</div>
{:else if filtered.length === 0}
	<div class="card text-ink-500 p-8 text-center">No matches.</div>
{:else}
	<div class="card divide-ink-100 divide-y-2">
		{#each filtered as evaluation (evaluation.id)}
			<a
				href="/app/evaluations/{evaluation.id}"
				class="hover:bg-ink-50 flex items-center gap-3 px-4 py-3"
			>
				<div class="min-w-0 flex-1">
					<p class="truncate font-semibold">
						{evaluation.customerName ?? 'Walk-up quote'}
					</p>
					<p class="text-ink-400 truncate text-sm">
						{evaluation.sheetName}
						{#if evaluation.createdByName}· {evaluation.createdByName}{/if}
					</p>
				</div>
				<div class="text-right">
					{#if evaluation.totalCents !== undefined}
						<p class="num text-glass-700 text-lg">{formatCents(evaluation.totalCents)}</p>
					{/if}
					<p class="text-ink-400 text-xs">{dateFmt.format(new Date(evaluation.createdAt))}</p>
				</div>
			</a>
		{/each}
	</div>
{/if}
