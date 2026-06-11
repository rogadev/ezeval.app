<script lang="ts">
	import { enhance } from '$app/forms';
	import Icon from '$lib/components/Icon.svelte';
	import { formatCents } from '$lib/pricing/engine';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const sheet = $derived(data.sheet);
	const showLivePrices = $derived(data.priceMode === 'full');

	// buttonId -> tapped quantity
	let counts = $state<Record<string, number>>({});
	let notes = $state('');
	// Seeded once: the job link doesn't change during capture.
	// svelte-ignore state_referenced_locally
	let customerId = $state(data.job?.customerId ?? '');
	let saving = $state(false);

	type ButtonRef = { id: string; label: string; pricingUnit: string; priceCents?: number };

	const allButtons = $derived(
		sheet.rows.flatMap((row) => row.buttons.map((b) => ({ row: row.label, ...b })))
	);
	const tappedLines = $derived(allButtons.filter((b) => (counts[b.id] ?? 0) > 0));
	const unitCount = $derived(tappedLines.reduce((sum, b) => sum + (counts[b.id] ?? 0), 0));

	// Live total for admins only (server reprices on save regardless).
	const liveTotalCents = $derived.by(() => {
		if (!showLivePrices) return null;
		const lines = tappedLines.reduce(
			(sum, b) => sum + (b.priceCents ?? 0) * (counts[b.id] ?? 0),
			0
		);
		const subtotal = lines + (sheet.setupFeeEnabled ? (sheet.setupFeeCents ?? 0) : 0);
		const min = sheet.minimumCents ?? 0;
		return unitCount === 0 ? 0 : Math.max(subtotal, min);
	});

	function tap(button: ButtonRef) {
		counts[button.id] = (counts[button.id] ?? 0) + 1;
		if (navigator.vibrate) navigator.vibrate(10);
	}
	function setCount(id: string, value: number) {
		counts[id] = Math.max(0, Math.min(10_000, Math.floor(value) || 0));
	}

	const itemsJson = $derived(
		JSON.stringify(
			Object.entries(counts)
				.filter(([, quantity]) => quantity > 0)
				.map(([buttonId, quantity]) => ({ buttonId, quantity }))
		)
	);

	const selectedCustomer = $derived(data.customers.find((c) => c.id === customerId));
</script>

<svelte:head>
	<title>Evaluating · {sheet.name} — EzEval</title>
</svelte:head>

<a
	href="/app/sheets"
	class="text-ink-500 hover:text-ink-800 mb-3 inline-flex items-center gap-1 text-sm font-medium"
>
	<Icon name="back" size={16} />
	Sheets
</a>

<!-- Sticky tally bar -->
<div class="card sticky top-16 z-20 mb-5 flex items-center justify-between px-5 py-3 lg:top-4">
	<div>
		<p class="field-label mb-0">Panes</p>
		<p class="num text-2xl">{unitCount}</p>
	</div>
	{#if showLivePrices}
		<div class="text-right">
			<p class="field-label mb-0">Running total</p>
			<p class="num text-glass-700 text-2xl">{formatCents(liveTotalCents ?? 0)}</p>
		</div>
	{:else if data.priceMode === 'total_end'}
		<p class="text-ink-400 max-w-[55%] text-right text-xs">
			Total is revealed when you save the evaluation
		</p>
	{:else}
		<span class="badge bg-ink-100 text-ink-600">Metrics only</span>
	{/if}
</div>

<h1 class="heading-display text-2xl">{sheet.name}</h1>

{#if selectedCustomer?.animalNotes}
	<p class="chip-hazard mt-3">
		<Icon name="paw" size={18} />
		{selectedCustomer.animalNotes}
	</p>
{/if}

<!-- Tap grid -->
<div class="mt-4 space-y-6">
	{#each sheet.rows as row (row.id)}
		{#if row.buttons.length}
			<section>
				<h2 class="heading-display text-ink-600 mb-2 text-lg">{row.label}</h2>
				<div class="grid grid-cols-3 gap-2 sm:gap-3">
					{#each row.buttons as button (button.id)}
						<button
							type="button"
							onclick={() => tap(button)}
							class="card hover:border-brand-500 active:border-brand-500 active:bg-brand-50 relative flex min-h-20 flex-col
								items-center justify-center gap-0.5 px-1 py-3 transition-colors active:translate-y-0.5 sm:min-h-24"
						>
							{#if (counts[button.id] ?? 0) > 0}
								<span
									class="bg-brand-500 text-ink-950 num absolute -top-2 -right-2 flex h-7 min-w-7 items-center justify-center rounded-full px-1.5 text-sm shadow"
								>
									{counts[button.id]}
								</span>
							{/if}
							<span class="px-1 text-center text-base leading-tight font-semibold sm:text-lg">
								{button.label}
							</span>
							{#if showLivePrices && button.priceCents !== undefined}
								<span class="num text-ink-400 text-xs font-normal">
									{formatCents(button.priceCents)}{button.pricingUnit === 'per_unit' ? '/pane' : ''}
								</span>
							{:else if button.pricingUnit === 'per_unit'}
								<span class="text-ink-400 text-xs">per pane</span>
							{/if}
						</button>
					{/each}
				</div>
			</section>
		{/if}
	{/each}
</div>

<!-- Review list -->
{#if tappedLines.length}
	<section class="mt-8">
		<h2 class="heading-display text-ink-600 mb-2 text-lg">Itemized</h2>
		<div class="card divide-ink-100 divide-y-2">
			{#each tappedLines as line (line.id)}
				<div class="flex items-center gap-2 px-4 py-2.5">
					<div class="min-w-0 flex-1">
						<p class="truncate font-semibold">{line.label}</p>
						<p class="text-ink-400 text-xs">{line.row}</p>
					</div>
					{#if showLivePrices && line.priceCents !== undefined}
						<span class="num text-ink-500 w-20 text-right text-sm">
							{formatCents(line.priceCents * (counts[line.id] ?? 0))}
						</span>
					{/if}
					<div class="flex items-center gap-1">
						<button
							type="button"
							class="btn-outline min-h-10 px-3"
							onclick={() => setCount(line.id, (counts[line.id] ?? 0) - 1)}
							aria-label="Decrease {line.label}"
						>
							<Icon name="minus" size={16} />
						</button>
						<input
							type="number"
							min="0"
							max="10000"
							value={counts[line.id] ?? 0}
							oninput={(e) => setCount(line.id, e.currentTarget.valueAsNumber)}
							class="field num w-16 px-1 py-1.5 text-center"
							aria-label="{line.label} quantity"
						/>
						<button
							type="button"
							class="btn-outline min-h-10 px-3"
							onclick={() => setCount(line.id, (counts[line.id] ?? 0) + 1)}
							aria-label="Increase {line.label}"
						>
							<Icon name="plus" size={16} />
						</button>
					</div>
				</div>
			{/each}
		</div>
	</section>
{/if}

<!-- Save -->
<form
	method="POST"
	action="?/save"
	class="mt-6 space-y-4"
	use:enhance={() => {
		saving = true;
		return async ({ update }) => {
			saving = false;
			await update({ reset: false });
		};
	}}
>
	<input type="hidden" name="items" value={itemsJson} />
	{#if data.job}
		<input type="hidden" name="jobId" value={data.job.id} />
	{/if}

	{#if form?.message}
		<p class="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{form.message}</p>
	{/if}

	<div class="card space-y-4 p-4">
		<div>
			<label for="customer" class="field-label">Customer (optional)</label>
			<select id="customer" name="customerId" bind:value={customerId} class="field">
				<option value="">— No customer —</option>
				{#each data.customers as customer (customer.id)}
					<option value={customer.id}>{customer.name}</option>
				{/each}
			</select>
		</div>
		<div>
			<label for="notes" class="field-label">Notes (optional)</label>
			<textarea
				id="notes"
				name="notes"
				rows="2"
				bind:value={notes}
				placeholder="Gate code, special access, follow-ups…"
				class="field"
			></textarea>
		</div>
	</div>

	<div class="sticky bottom-20 z-20 lg:bottom-4">
		<button
			type="submit"
			disabled={saving || unitCount === 0}
			class="btn-primary w-full text-lg shadow-lg"
		>
			{saving ? 'Saving…' : unitCount === 0 ? 'Tap items to begin' : 'Save evaluation'}
		</button>
	</div>
</form>
