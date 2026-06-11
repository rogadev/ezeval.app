<script lang="ts">
	import { enhance } from '$app/forms';
	import CustomerFields from '$lib/components/CustomerFields.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import { formatCents, formatTaxRate } from '$lib/pricing/engine';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	const view = $derived(data.view);
	let creatingCustomer = $state(false);
	let attachId = $state('');

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
			{#if data.evaluation.customerId}
				<a href="/app/customers/{data.evaluation.customerId}" class="hover:underline">
					{data.evaluation.customerName ?? 'Customer'}
				</a>
			{:else}
				{data.evaluation.customerName ?? 'Walk-up quote'}
			{/if}
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

{#if !data.evaluation.customerId}
	<!-- Walk-up quote: attach or create the customer after the fact -->
	<div class="card border-brand-300 mt-6 p-5">
		<h2 class="heading-display text-lg">Who was this for?</h2>
		<p class="text-ink-500 mt-0.5 text-sm">
			Attach a customer so this quote shows up on their record.
		</p>

		{#if form?.message}
			<p class="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
				{form.message}
			</p>
		{/if}

		{#if !creatingCustomer}
			<div class="mt-4 flex flex-col gap-2 sm:flex-row">
				{#if data.attachableCustomers.length}
					<form method="POST" action="?/attachCustomer" class="flex flex-1 gap-2" use:enhance>
						<select name="customerId" bind:value={attachId} class="field flex-1" required>
							<option value="">— Pick an existing customer —</option>
							{#each data.attachableCustomers as customer (customer.id)}
								<option value={customer.id}>{customer.name}</option>
							{/each}
						</select>
						<button type="submit" disabled={!attachId} class="btn-dark">Attach</button>
					</form>
				{/if}
				<button type="button" class="btn-outline" onclick={() => (creatingCustomer = true)}>
					<Icon name="plus" size={18} />
					New customer
				</button>
			</div>
		{:else}
			<form method="POST" action="?/createAndAttach" class="mt-4 space-y-4" use:enhance>
				<CustomerFields />
				<div class="flex gap-2">
					<button type="button" class="btn-ghost" onclick={() => (creatingCustomer = false)}>
						Cancel
					</button>
					<button type="submit" class="btn-primary flex-1">Save & attach</button>
				</div>
			</form>
		{/if}
	</div>
{/if}

<!-- Itemized ticket -->
<div class="card mt-6 overflow-x-auto">
	<table class="w-full text-left">
		<thead>
			<!-- field-label can't be used here: its display:block breaks <th> layout -->
			<tr
				class="border-ink-200 text-ink-500 font-display border-b-2 text-sm font-semibold tracking-wide uppercase"
			>
				<th class="px-4 py-3">Height</th>
				<th class="px-4 py-3">Item</th>
				{#if view.priceVisibility === 'full'}
					<th class="px-4 py-3 text-right">Each</th>
				{/if}
				<th class="px-4 py-3 text-right"># of</th>
				{#if view.priceVisibility === 'full'}
					<th class="px-4 py-3 text-right">Price</th>
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

{#if view.totalCents !== undefined && data.taxes.length}
	<div class="card mt-4 px-4 py-3">
		<div class="divide-ink-100 divide-y">
			{#each data.taxes as tax (tax.name + tax.rateMilliPct)}
				<div class="text-ink-600 flex items-center justify-between py-1.5 text-sm">
					<span>{tax.name} ({formatTaxRate(tax.rateMilliPct)})</span>
					<span class="num">{formatCents(tax.amountCents)}</span>
				</div>
			{/each}
			<div class="flex items-center justify-between py-2 font-bold">
				<span>Total with tax</span>
				<span class="num text-glass-700 text-lg">{formatCents(data.totalWithTaxCents ?? 0)}</span>
			</div>
		</div>
	</div>
{/if}

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
