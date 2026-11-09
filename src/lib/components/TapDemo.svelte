<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import { computeEvaluation, formatCents, redactForViewer } from '$lib/pricing/engine';
	import { parseDollarsToCents } from '$lib/pricing/money';
	import { SAMPLE_COUNTS, SAMPLE_SHEET } from '$lib/pricing/sample-sheet';

	/**
	 * A working copy of the tap tool for the public site. It prices with the
	 * same engine the app uses, on the sample sheet, and stores nothing.
	 */
	let {
		editable = false
	}: {
		/** Adds the price, setup fee, and minimum inputs (the calculator page). */
		editable?: boolean;
	} = $props();

	type View = 'owner' | 'total' | 'counts';
	const VIEWS: { id: View; label: string; detail: string }[] = [
		{ id: 'owner', label: 'Owner', detail: 'every price' },
		{ id: 'total', label: 'Estimator', detail: 'total only' },
		{ id: 'counts', label: 'Estimator', detail: 'counts only' }
	];

	const MAX_COUNT = 999;
	const allButtons = SAMPLE_SHEET.rows.flatMap((row) =>
		row.buttons.map((button) => ({ ...button, rowLabel: row.label }))
	);

	let view = $state<View>('owner');
	let counts = $state<Record<string, number>>({ ...SAMPLE_COUNTS });
	let prices = $state<Record<string, number>>(
		Object.fromEntries(allButtons.map((b) => [b.id, b.priceCents]))
	);
	let setupFeeEnabled = $state(SAMPLE_SHEET.setupFeeEnabled);
	let setupFeeCents = $state(SAMPLE_SHEET.setupFeeCents);
	let minimumCents = $state(SAMPLE_SHEET.minimumCents);
	/** Field ids whose current text is not a valid dollar amount. */
	let invalid = $state<Record<string, boolean>>({});

	const visibility = $derived(view === 'counts' ? 'metrics_only' : 'grand_total');
	const computed = $derived(
		computeEvaluation(
			{ setupFeeEnabled, setupFeeCents, minimumCents, estimatorVisibility: visibility },
			allButtons.map((b) => ({
				rowLabel: b.rowLabel,
				buttonLabel: b.label,
				pricingUnit: b.pricingUnit,
				unitPriceCents: prices[b.id],
				quantity: counts[b.id] ?? 0
			}))
		)
	);
	// What the chosen viewer is allowed to see. Hidden fields are absent, not zeroed.
	const seen = $derived(
		redactForViewer(computed, view === 'owner' ? 'admin' : 'estimator', visibility)
	);

	function tap(id: string) {
		counts[id] = Math.min(MAX_COUNT, (counts[id] ?? 0) + 1);
	}
	function untap(id: string) {
		counts[id] = Math.max(0, (counts[id] ?? 0) - 1);
	}

	function toDollars(cents: number): string {
		return (cents / 100).toFixed(2);
	}
	/** Applies a typed dollar amount, or flags the field and keeps the last good value. */
	function applyDollars(field: string, raw: string, apply: (cents: number) => void) {
		const cents = parseDollarsToCents(raw);
		invalid[field] = cents === null;
		if (cents !== null) apply(cents);
	}
</script>

<div class={editable ? 'grid items-start gap-6 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]' : ''}>
	<div class="border-ink-700 bg-paper text-ink-900 rounded-[1.75rem] border-4 p-3 sm:p-4">
		<fieldset>
			<legend class="text-ink-600 mb-1.5 text-sm font-medium">Who's holding the phone?</legend>
			<div class="bg-ink-100 grid grid-cols-3 gap-1 rounded-xl p-1">
				{#each VIEWS as option (option.id)}
					<label
						class="cursor-pointer rounded-lg px-1 py-1.5 text-center leading-tight transition-colors
							has-focus-visible:outline-brand-500 has-focus-visible:outline-3
							{view === option.id ? 'bg-ink-900 text-paper' : 'text-ink-700 hover:bg-white'}"
					>
						<input
							type="radio"
							name="demo-view"
							value={option.id}
							bind:group={view}
							class="sr-only"
						/>
						<span class="block text-sm font-semibold">{option.label}</span>
						<span class="block text-xs {view === option.id ? 'text-ink-300' : 'text-ink-600'}">
							{option.detail}
						</span>
					</label>
				{/each}
			</div>
		</fieldset>

		<div class="card mt-3 flex items-center justify-between px-4 py-2.5" aria-live="polite">
			<div>
				<p class="text-ink-600 text-xs font-medium">Items</p>
				<p class="num text-xl">{seen.unitCount}</p>
			</div>
			<div class="text-right">
				{#if seen.totalCents !== undefined}
					<p class="text-ink-600 text-xs font-medium">
						{view === 'owner' ? 'Running total' : 'Total'}
					</p>
					<p class="num text-glass-700 text-xl">{formatCents(seen.totalCents)}</p>
				{:else}
					<p class="text-ink-600 max-w-36 text-xs font-medium">No dollar amounts on this phone</p>
				{/if}
			</div>
		</div>

		{#each SAMPLE_SHEET.rows as row (row.label)}
			<p class="mt-3 mb-1.5 flex items-baseline justify-between gap-2">
				<span class="font-display text-ink-800 text-base font-semibold tracking-wide">
					{row.label}
				</span>
				<span class="text-ink-600 text-xs">{row.hint}</span>
			</p>
			<div class="grid grid-cols-3 gap-1.5">
				{#each row.buttons as button (button.id)}
					{@const count = counts[button.id] ?? 0}
					<div class="relative">
						<button
							type="button"
							onclick={() => tap(button.id)}
							aria-label="Add one {button.label}, {row.label}. Count {count}"
							class="card hover:border-brand-500 active:border-brand-500 active:bg-brand-50 flex min-h-16 w-full
								cursor-pointer flex-col items-center justify-center px-1 text-sm font-semibold transition-colors
								select-none active:translate-y-0.5"
						>
							{button.label}
							{#if view === 'owner'}
								<span class="num text-ink-600 text-xs font-normal">
									{formatCents(prices[button.id])}{button.pricingUnit === 'per_unit' ? '/pane' : ''}
								</span>
							{:else if button.pricingUnit === 'per_unit'}
								<span class="text-ink-600 text-xs font-normal">per pane</span>
							{/if}
						</button>
						{#if count > 0}
							<span
								class="bg-brand-500 text-ink-950 num pointer-events-none absolute -top-1.5 -right-1.5 flex h-6 min-w-6
									items-center justify-center rounded-full px-1 text-xs"
							>
								{count}
							</span>
							<button
								type="button"
								onclick={() => untap(button.id)}
								aria-label="Remove one {button.label}, {row.label}"
								class="border-ink-300 text-ink-700 hover:border-ink-500 absolute top-1 left-1 flex h-6 w-6
									cursor-pointer items-center justify-center rounded-full border-2 bg-white before:absolute
									before:-inset-1.5 before:rounded-full"
							>
								<Icon name="minus" size={12} />
							</button>
						{/if}
					</div>
				{/each}
			</div>
		{/each}

		<!-- The estimate, as this viewer receives it -->
		<div class="border-ink-300 mt-4 border-t-2 border-dashed pt-3">
			{#if seen.unitCount === 0}
				<p class="text-ink-600 text-sm">Tap a window to start the estimate.</p>
			{:else}
				<details open={editable}>
					<summary class="text-ink-700 cursor-pointer text-sm font-semibold">
						Itemized, {seen.items.length}
						{seen.items.length === 1 ? 'line' : 'lines'}
					</summary>
					<ul class="mt-2 space-y-1 text-sm">
						{#each seen.items as item (item.rowLabel + item.buttonLabel)}
							<li class="flex items-baseline justify-between gap-3">
								<span>
									<span class="num">{item.quantity}</span>
									&times; {item.buttonLabel}
									<span class="text-ink-600">{item.rowLabel}</span>
								</span>
								{#if item.lineTotalCents !== undefined}
									<span class="num font-normal">{formatCents(item.lineTotalCents)}</span>
								{/if}
							</li>
						{/each}
					</ul>
				</details>

				<dl class="mt-3 space-y-1 text-sm">
					{#if seen.setupFeeCents}
						<div class="flex justify-between">
							<dt>Setup fee</dt>
							<dd class="num font-normal">{formatCents(seen.setupFeeCents)}</dd>
						</div>
					{/if}
					{#if seen.minimumApplied && seen.subtotalCents !== undefined}
						<div class="text-ink-600 flex justify-between">
							<dt>Subtotal, under your minimum</dt>
							<dd class="num font-normal line-through">{formatCents(seen.subtotalCents)}</dd>
						</div>
					{/if}
					{#if seen.totalCents !== undefined}
						<div class="flex items-baseline justify-between pt-1 text-base font-semibold">
							<dt>{seen.minimumApplied ? 'Total, at your minimum' : 'Total'}</dt>
							<dd class="num text-glass-700 text-xl">{formatCents(seen.totalCents)}</dd>
						</div>
					{:else}
						<p class="text-ink-700 pt-1 font-medium">
							Counts go to the office. The owner prices the job.
						</p>
					{/if}
				</dl>
			{/if}
		</div>

		<button
			type="button"
			onclick={() => (counts = {})}
			disabled={seen.unitCount === 0}
			class="btn-outline btn-sm mt-3 w-full"
		>
			Clear and start over
		</button>
	</div>

	{#if editable}
		<form class="card space-y-5 p-5" onsubmit={(event) => event.preventDefault()}>
			<div>
				<h2 class="font-display text-2xl font-semibold tracking-wide">Your prices</h2>
				<p class="text-ink-600 mt-1 text-sm">
					Change any number and the estimate updates. Nothing here is saved or sent anywhere.
				</p>
			</div>

			{#each SAMPLE_SHEET.rows as row (row.label)}
				<fieldset>
					<legend class="text-ink-800 mb-1.5 text-sm font-semibold">
						{row.label} <span class="text-ink-600 font-normal">({row.hint.toLowerCase()})</span>
					</legend>
					<div class="grid grid-cols-3 gap-2">
						{#each row.buttons as button (button.id)}
							<label class="block text-xs font-medium">
								{button.label}{button.pricingUnit === 'per_unit' ? ', per pane' : ''}
								<input
									type="text"
									inputmode="decimal"
									value={toDollars(prices[button.id])}
									aria-invalid={invalid[button.id] ? 'true' : undefined}
									onchange={(e) =>
										applyDollars(button.id, e.currentTarget.value, (c) => (prices[button.id] = c))}
									class="field num mt-1 px-2 py-2 text-sm aria-invalid:border-red-500"
								/>
							</label>
						{/each}
					</div>
				</fieldset>
			{/each}

			<div class="grid gap-3 sm:grid-cols-2">
				<div>
					<label class="block text-xs font-medium" for="demo-setup-fee">Setup fee, every job</label>
					<input
						id="demo-setup-fee"
						type="text"
						inputmode="decimal"
						value={toDollars(setupFeeCents)}
						disabled={!setupFeeEnabled}
						aria-invalid={invalid.setup ? 'true' : undefined}
						onchange={(e) =>
							applyDollars('setup', e.currentTarget.value, (c) => (setupFeeCents = c))}
						class="field num mt-1 px-2 py-2 text-sm disabled:opacity-50 aria-invalid:border-red-500"
					/>
					<label class="mt-2 flex items-center gap-2 text-sm">
						<input
							type="checkbox"
							bind:checked={setupFeeEnabled}
							class="text-brand-600 border-ink-300 h-5 w-5 rounded"
						/>
						Charge a setup fee
					</label>
				</div>
				<div>
					<label class="block text-xs font-medium" for="demo-minimum">Minimum quote</label>
					<input
						id="demo-minimum"
						type="text"
						inputmode="decimal"
						value={toDollars(minimumCents)}
						aria-invalid={invalid.minimum ? 'true' : undefined}
						onchange={(e) =>
							applyDollars('minimum', e.currentTarget.value, (c) => (minimumCents = c))}
						class="field num mt-1 px-2 py-2 text-sm aria-invalid:border-red-500"
					/>
					<p class="text-ink-600 mt-2 text-xs">Enter 0 for no minimum.</p>
				</div>
			</div>

			{#if Object.values(invalid).some(Boolean)}
				<p class="text-sm font-medium text-red-700" role="alert">
					Enter dollar amounts like 4 or 4.50. The fields marked in red kept their last value.
				</p>
			{/if}
		</form>
	{/if}
</div>
