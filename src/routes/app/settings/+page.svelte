<script lang="ts">
	import { enhance } from '$app/forms';
	import Icon from '$lib/components/Icon.svelte';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let saving = $state(false);
	let savedFlash = $state(false);
	const info = $derived(data.businessInfo);
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
				<input
					id="b-country"
					name="country"
					type="text"
					value={info.country ?? ''}
					class="field"
				/>
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
