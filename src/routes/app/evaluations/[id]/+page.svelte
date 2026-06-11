<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import { formatCents } from '$lib/pricing/engine';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const view = $derived(data.view);

	const dateFmt = new Intl.DateTimeFormat('en-US', {
		weekday: 'short',
		month: 'short',
		day: 'numeric',
		hour: 'numeric',
		minute: '2-digit'
	});
</script>

<svelte:head>
	<title>Quote · {data.evaluation.customerName ?? data.evaluation.sheetName} — EzEval</title>
</svelte:head>

<a
	href="/app/evaluations"
	class="text-ink-500 hover:text-ink-800 mb-3 inline-flex items-center gap-1 text-sm font-medium"
>
	<Icon name="back" size={16} />
	Quotes
</a>

<div class="flex flex-wrap items-start justify-between gap-3">
	<div>
		<h1 class="heading-display text-3xl">
			{data.evaluation.customerName ?? 'Walk-up quote'}
		</h1>
		<p class="text-ink-500 mt-1 text-sm">
			{data.evaluation.sheetName} · {dateFmt.format(new Date(data.evaluation.createdAt))}
			{#if data.evaluation.createdByName}· by {data.evaluation.createdByName}{/if}
		</p>
	</div>
	{#if view.totalCents !== undefined}
		<div class="card px-5 py-3 text-right">
			<p class="field-label mb-0">Total</p>
			<p class="num text-glass-700 text-3xl">{formatCents(view.totalCents)}</p>
		</div>
	{/if}
</div>

<!-- Itemized ticket -->
<div class="card mt-6 overflow-x-auto">
	<table class="w-full text-left">
		<thead>
			<tr class="border-ink-200 text-ink-500 border-b-2">
				<th class="field-label px-4 py-3">Height</th>
				<th class="field-label px-4 py-3">Item</th>
				{#if view.priceVisibility === 'full'}
					<th class="field-label px-4 py-3 text-right">Each</th>
				{/if}
				<th class="field-label px-4 py-3 text-right"># of</th>
				{#if view.priceVisibility === 'full'}
					<th class="field-label px-4 py-3 text-right">Price</th>
				{/if}
			</tr>
		</thead>
		<tbody class="divide-ink-100 divide-y">
			{#each view.items as item, i (i)}
				<tr>
					<td class="text-ink-500 px-4 py-2.5">{item.rowLabel}</td>
					<td class="px-4 py-2.5 font-semibold">
						{item.buttonLabel}{item.pricingUnit === 'per_unit' ? ' (per pane)' : ''}
					</td>
					{#if view.priceVisibility === 'full'}
						<td class="num px-4 py-2.5 text-right font-normal">
							{formatCents(item.unitPriceCents ?? 0)}
						</td>
					{/if}
					<td class="num px-4 py-2.5 text-right">{item.quantity}</td>
					{#if view.priceVisibility === 'full'}
						<td class="num px-4 py-2.5 text-right">{formatCents(item.lineTotalCents ?? 0)}</td>
					{/if}
				</tr>
			{/each}
		</tbody>
		{#if view.priceVisibility === 'full'}
			<tfoot class="border-ink-200 border-t-2">
				{#if (view.setupFeeCents ?? 0) > 0}
					<tr>
						<td colspan="4" class="text-ink-500 px-4 py-2 text-right">Setup fee</td>
						<td class="num px-4 py-2 text-right">{formatCents(view.setupFeeCents ?? 0)}</td>
					</tr>
				{/if}
				<tr>
					<td colspan="4" class="text-ink-500 px-4 py-2 text-right">Subtotal</td>
					<td class="num px-4 py-2 text-right">{formatCents(view.subtotalCents ?? 0)}</td>
				</tr>
				{#if view.minimumApplied}
					<tr>
						<td colspan="4" class="text-ink-500 px-4 py-2 text-right">Minimum applied</td>
						<td class="num text-brand-700 px-4 py-2 text-right">
							{formatCents(view.totalCents ?? 0)}
						</td>
					</tr>
				{/if}
				<tr class="border-ink-200 border-t-2">
					<td colspan="4" class="px-4 py-3 text-right font-bold">Grand total</td>
					<td class="num text-glass-700 px-4 py-3 text-right text-lg">
						{formatCents(view.totalCents ?? 0)}
					</td>
				</tr>
			</tfoot>
		{/if}
	</table>
</div>

<div class="text-ink-500 mt-4 flex items-center justify-between text-sm">
	<span class="num">{view.unitCount} panes total</span>
	{#if view.priceVisibility === 'none'}
		<span class="badge bg-ink-100 text-ink-600">Metrics only — office prices this job</span>
	{/if}
</div>

{#if data.evaluation.notes}
	<div class="card mt-4 p-4">
		<p class="field-label">Notes</p>
		<p class="whitespace-pre-wrap">{data.evaluation.notes}</p>
	</div>
{/if}
