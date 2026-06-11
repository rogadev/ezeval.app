<script lang="ts">
	import { enhance } from '$app/forms';
	import Icon from '$lib/components/Icon.svelte';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	// Local editable copy: prices as dollar strings for friendly editing.
	const toDollars = (cents: number) => (cents / 100).toFixed(2).replace(/\.00$/, '');

	// The editor owns its draft after load — seed once from server data.
	// svelte-ignore state_referenced_locally
	const initial = data.sheet;

	let name = $state(initial.name);
	let setupFeeEnabled = $state(initial.setupFeeEnabled);
	let setupFee = $state(toDollars(initial.setupFeeCents));
	let estimatorVisibility = $state(initial.estimatorVisibility);
	let minimum = $state(toDollars(initial.minimumCents));
	let rows = $state(
		initial.rows.map((row) => ({
			label: row.label,
			buttons: row.buttons.map((b) => ({
				label: b.label,
				price: toDollars(b.priceCents),
				pricingUnit: b.pricingUnit as string
			}))
		}))
	);

	let saving = $state(false);
	let savedFlash = $state(false);

	const definition = $derived(
		JSON.stringify({ name, setupFeeEnabled, setupFee, estimatorVisibility, minimum, rows })
	);

	function addRow() {
		rows.push({ label: '', buttons: [] });
	}
	function removeRow(index: number) {
		rows.splice(index, 1);
	}
	function moveRow(index: number, delta: number) {
		const target = index + delta;
		if (target < 0 || target >= rows.length) return;
		[rows[index], rows[target]] = [rows[target], rows[index]];
	}
	function addButton(rowIndex: number) {
		rows[rowIndex].buttons.push({ label: '', price: '', pricingUnit: 'flat' });
	}
	function removeButton(rowIndex: number, buttonIndex: number) {
		rows[rowIndex].buttons.splice(buttonIndex, 1);
	}
</script>

<svelte:head>
	<title>Edit {data.sheet.name} — EzEval</title>
</svelte:head>

<a
	href="/app/sheets"
	class="text-ink-500 hover:text-ink-800 mb-3 inline-flex items-center gap-1 text-sm font-medium"
>
	<Icon name="back" size={16} />
	All sheets
</a>

<h1 class="heading-display mb-5 text-3xl">Edit sheet</h1>

<form
	method="POST"
	action="?/save"
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
	<input type="hidden" name="definition" value={definition} />

	{#if form?.message}
		<p class="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
			{form.message}
		</p>
	{/if}

	<!-- Sheet settings -->
	<div class="card space-y-5 p-5">
		<div>
			<label for="sheet-name" class="field-label">Sheet name</label>
			<input id="sheet-name" type="text" bind:value={name} maxlength="60" class="field" />
		</div>

		<div class="grid gap-5 sm:grid-cols-2">
			<div>
				<span class="field-label">Field staff see</span>
				<div class="space-y-2">
					<label
						class="flex cursor-pointer items-start gap-3 rounded-xl border-2 p-3 {estimatorVisibility ===
						'grand_total'
							? 'border-brand-500 bg-brand-50'
							: 'border-ink-200'}"
					>
						<input
							type="radio"
							bind:group={estimatorVisibility}
							value="grand_total"
							class="text-brand-500 focus:ring-brand-500 mt-1"
						/>
						<span>
							<span class="block font-semibold">Grand total only</span>
							<span class="text-ink-500 text-sm">
								They can quote on-site but never see per-button prices.
							</span>
						</span>
					</label>
					<label
						class="flex cursor-pointer items-start gap-3 rounded-xl border-2 p-3 {estimatorVisibility ===
						'metrics_only'
							? 'border-brand-500 bg-brand-50'
							: 'border-ink-200'}"
					>
						<input
							type="radio"
							bind:group={estimatorVisibility}
							value="metrics_only"
							class="text-brand-500 focus:ring-brand-500 mt-1"
						/>
						<span>
							<span class="block font-semibold">Metrics only</span>
							<span class="text-ink-500 text-sm">
								No dollar amounts at all — you price the job back at the office.
							</span>
						</span>
					</label>
				</div>
			</div>

			<div class="space-y-5">
				<div>
					<label for="minimum" class="field-label">Minimum quote ($)</label>
					<input id="minimum" type="text" inputmode="decimal" bind:value={minimum} class="field" />
					<p class="text-ink-400 mt-1 text-xs">
						Displayed totals never fall below this — it also stops staff from learning single-button
						prices.
					</p>
				</div>
				<div>
					<label class="flex cursor-pointer items-center gap-3">
						<input
							type="checkbox"
							bind:checked={setupFeeEnabled}
							class="text-brand-500 focus:ring-brand-500 h-5 w-5 rounded"
						/>
						<span class="font-semibold">Auto-attach setup fee</span>
					</label>
					{#if setupFeeEnabled}
						<div class="mt-2">
							<label for="setup-fee" class="field-label">Setup fee ($)</label>
							<input
								id="setup-fee"
								type="text"
								inputmode="decimal"
								bind:value={setupFee}
								class="field"
							/>
							<p class="text-ink-400 mt-1 text-xs">
								Added to every evaluation on this sheet automatically.
							</p>
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>

	<!-- Grid editor -->
	<div class="mt-6 space-y-4">
		{#each rows as row, rowIndex (rowIndex)}
			<div class="card p-4 sm:p-5">
				<div class="flex items-center gap-2">
					<input
						type="text"
						bind:value={row.label}
						placeholder="Row label (e.g. High Level)"
						maxlength="40"
						class="field font-display flex-1 text-lg font-semibold tracking-wide uppercase"
					/>
					<button
						type="button"
						class="btn-ghost px-3"
						onclick={() => moveRow(rowIndex, -1)}
						disabled={rowIndex === 0}
						aria-label="Move row up"
					>
						↑
					</button>
					<button
						type="button"
						class="btn-ghost px-3"
						onclick={() => moveRow(rowIndex, 1)}
						disabled={rowIndex === rows.length - 1}
						aria-label="Move row down"
					>
						↓
					</button>
					<button
						type="button"
						class="btn-ghost px-3 text-red-600"
						onclick={() => removeRow(rowIndex)}
						aria-label="Delete row"
					>
						<Icon name="trash" size={18} />
					</button>
				</div>

				<div class="mt-3 grid gap-2 sm:grid-cols-2">
					{#each row.buttons as button, buttonIndex (buttonIndex)}
						<div class="border-ink-200 flex items-center gap-2 rounded-xl border-2 p-2">
							<input
								type="text"
								bind:value={button.label}
								placeholder="Button label"
								maxlength="40"
								class="field min-w-0 flex-1 border-0 px-2 py-1.5"
							/>
							<span class="text-ink-400 font-semibold">$</span>
							<input
								type="text"
								inputmode="decimal"
								bind:value={button.price}
								placeholder="0.00"
								class="field num w-20 border-0 px-2 py-1.5"
							/>
							<select
								bind:value={button.pricingUnit}
								class="field w-auto border-0 px-1 py-1.5 text-sm"
							>
								<option value="flat">each</option>
								<option value="per_unit">/pane</option>
							</select>
							<button
								type="button"
								class="text-ink-400 p-1 hover:text-red-600"
								onclick={() => removeButton(rowIndex, buttonIndex)}
								aria-label="Remove button"
							>
								<Icon name="x" size={18} />
							</button>
						</div>
					{/each}
					<button
						type="button"
						class="btn-outline border-dashed"
						onclick={() => addButton(rowIndex)}
					>
						<Icon name="plus" size={18} />
						Add button
					</button>
				</div>
			</div>
		{/each}

		<button type="button" class="btn-outline w-full border-dashed" onclick={addRow}>
			<Icon name="plus" size={20} />
			Add row
		</button>
	</div>

	<!-- Sticky save bar -->
	<div class="sticky bottom-20 z-20 mt-6 lg:bottom-4">
		<div class="card flex items-center justify-between gap-3 p-3">
			{#if savedFlash}
				<span class="text-glass-700 flex items-center gap-1.5 font-semibold">
					<Icon name="check" size={20} />
					Saved
				</span>
			{:else}
				<span class="text-ink-500 text-sm">Changes apply to new evaluations only.</span>
			{/if}
			<button type="submit" disabled={saving} class="btn-primary min-w-32">
				{saving ? 'Saving…' : 'Save sheet'}
			</button>
		</div>
	</div>
</form>
