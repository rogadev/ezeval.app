<script lang="ts">
	import { enhance } from '$app/forms';
	import Icon from '$lib/components/Icon.svelte';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let saving = $state(false);
	let savedFlash = $state(false);
	const info = $derived(data.businessInfo);

	// Tax editor draft, seeded from the saved profile once.
	// svelte-ignore state_referenced_locally
	let taxes = $state(
		data.taxes.map((tax) => ({
			name: tax.name,
			rate: (tax.rateMilliPct / 1000).toString()
		}))
	);
	let savingTaxes = $state(false);
	let taxesFlash = $state(false);

	const PRESETS = [
		{ label: '+ PST', name: 'PST', rate: '7' },
		{ label: '+ QST', name: 'QST', rate: '9.975' },
		{ label: 'Use HST instead', replace: true, name: 'HST', rate: '13' }
	];

	function applyPreset(preset: (typeof PRESETS)[number]) {
		if (preset.replace) {
			taxes = [{ name: preset.name, rate: preset.rate }];
		} else {
			taxes.push({ name: preset.name, rate: preset.rate });
		}
	}
</script>

<svelte:head>
	<title>Business info — EzEval</title>
</svelte:head>

<h1 class="heading-display text-3xl">Business info</h1>
<p class="text-ink-500 mt-1 max-w-2xl text-sm">
	This is what will appear on your quotes and invoices when document generation lands — fill it in
	once and it'll be ready.
</p>

<form
	method="POST"
	action="?/saveInfo"
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
	{#if form && 'message' in form && form.message}
		<p class="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{form.message}</p>
	{/if}

	<div class="grid gap-4 sm:grid-cols-2">
		<div class="sm:col-span-2">
			<label for="b-name" class="field-label">Business name</label>
			<input id="b-name" name="name" type="text" required value={info.name} class="field" />
		</div>
		<div>
			<label for="b-email" class="field-label">Contact email</label>
			<input
				id="b-email"
				name="contactEmail"
				type="email"
				value={info.contactEmail ?? ''}
				class="field"
			/>
		</div>
		<div>
			<label for="b-phone" class="field-label">Contact phone</label>
			<input
				id="b-phone"
				name="contactPhone"
				type="tel"
				value={info.contactPhone ?? ''}
				class="field"
			/>
		</div>
		<div class="sm:col-span-2">
			<label for="b-address1" class="field-label">Street address</label>
			<input
				id="b-address1"
				name="addressLine1"
				type="text"
				value={info.addressLine1 ?? ''}
				class="field"
			/>
		</div>
		<div class="sm:col-span-2">
			<label for="b-address2" class="field-label">Suite / line 2</label>
			<input
				id="b-address2"
				name="addressLine2"
				type="text"
				value={info.addressLine2 ?? ''}
				class="field"
			/>
		</div>
		<div>
			<label for="b-city" class="field-label">City</label>
			<input id="b-city" name="city" type="text" value={info.city ?? ''} class="field" />
		</div>
		<div class="grid grid-cols-3 gap-4">
			<div>
				<label for="b-region" class="field-label">Prov/State</label>
				<input id="b-region" name="region" type="text" value={info.region ?? ''} class="field" />
			</div>
			<div>
				<label for="b-postal" class="field-label">Postal</label>
				<input
					id="b-postal"
					name="postalCode"
					type="text"
					value={info.postalCode ?? ''}
					class="field"
				/>
			</div>
			<div>
				<label for="b-country" class="field-label">Country</label>
				<input id="b-country" name="country" type="text" value={info.country ?? ''} class="field" />
			</div>
		</div>
	</div>

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
			{saving ? 'Saving…' : 'Save'}
		</button>
	</div>
</form>

<!-- Sales taxes -->
<h2 class="heading-display mt-10 text-2xl">Sales taxes</h2>
<p class="text-ink-500 mt-1 max-w-2xl text-sm">
	Applied to every quote total. GST 5% is the Canadian baseline — add your province's PST, or
	replace it with HST if that's how your province rolls. No PST in Alberta? Just leave GST on its
	own.
</p>

<form
	method="POST"
	action="?/saveTaxes"
	class="card mt-4 space-y-3 p-5"
	use:enhance={() => {
		savingTaxes = true;
		return async ({ update, result }) => {
			savingTaxes = false;
			await update({ reset: false });
			if (result.type === 'success') {
				taxesFlash = true;
				setTimeout(() => (taxesFlash = false), 2500);
			}
		};
	}}
>
	<input type="hidden" name="taxes" value={JSON.stringify(taxes)} />

	{#if form && 'taxMessage' in form && form.taxMessage}
		<p class="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
			{form.taxMessage}
		</p>
	{/if}

	{#each taxes as tax, index (index)}
		<div class="flex items-center gap-2">
			<input
				type="text"
				bind:value={tax.name}
				placeholder="Name (e.g. GST)"
				maxlength="20"
				class="field flex-1"
				aria-label="Tax name"
			/>
			<div class="relative">
				<input
					type="text"
					inputmode="decimal"
					bind:value={tax.rate}
					placeholder="5"
					class="field num w-28 pr-8"
					aria-label="Tax rate percent"
				/>
				<span class="text-ink-400 absolute top-1/2 right-3 -translate-y-1/2 font-semibold">%</span>
			</div>
			<button
				type="button"
				class="text-ink-400 p-2 hover:text-red-600"
				onclick={() => taxes.splice(index, 1)}
				aria-label="Remove tax"
			>
				<Icon name="x" size={18} />
			</button>
		</div>
	{:else}
		<p class="text-ink-400 text-sm">No taxes — quote totals are shown without tax.</p>
	{/each}

	<div class="flex flex-wrap items-center gap-2 pt-1">
		<button
			type="button"
			class="btn-outline min-h-10 border-dashed px-3 text-sm"
			onclick={() => taxes.push({ name: '', rate: '' })}
		>
			<Icon name="plus" size={16} />
			Add tax
		</button>
		{#each PRESETS as preset (preset.label)}
			<button
				type="button"
				class="btn-ghost min-h-10 px-3 text-sm"
				onclick={() => applyPreset(preset)}
			>
				{preset.label}
			</button>
		{/each}
	</div>

	<div class="flex items-center justify-between gap-3 pt-2">
		{#if taxesFlash}
			<span class="text-glass-700 flex items-center gap-1.5 font-semibold">
				<Icon name="check" size={20} />
				Saved — applies to new quotes
			</span>
		{:else}
			<span class="text-ink-400 text-xs">Past quotes keep the tax they were saved with.</span>
		{/if}
		<button type="submit" disabled={savingTaxes} class="btn-primary min-w-32">
			{savingTaxes ? 'Saving…' : 'Save taxes'}
		</button>
	</div>
</form>
