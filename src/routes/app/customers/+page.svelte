<script lang="ts">
	import { enhance } from '$app/forms';
	import CustomerFields from '$lib/components/CustomerFields.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let adding = $state(false);
	let search = $state('');

	const filtered = $derived(
		search.trim()
			? data.customers.filter((c) =>
					[c.name, c.addressLine1, c.city]
						.filter(Boolean)
						.some((v) => v!.toLowerCase().includes(search.trim().toLowerCase()))
				)
			: data.customers
	);
</script>

<svelte:head>
	<title>Customers — EzEval</title>
</svelte:head>

<div class="mb-5 flex items-center justify-between gap-3">
	<h1 class="heading-display text-3xl">Customers</h1>
	<button type="button" class="btn-primary" onclick={() => (adding = !adding)}>
		<Icon name={adding ? 'x' : 'plus'} size={20} />
		{adding ? 'Cancel' : 'New'}
	</button>
</div>

{#if form?.message}
	<p class="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{form.message}</p>
{/if}

{#if adding}
	<form method="POST" action="?/create" class="card mb-6 space-y-4 p-5" use:enhance>
		<h2 class="heading-display text-lg">New customer</h2>
		<CustomerFields />
		<button type="submit" class="btn-dark w-full">Save customer</button>
	</form>
{/if}

{#if data.customers.length > 5}
	<input
		type="search"
		placeholder="Search customers…"
		bind:value={search}
		class="field mb-4"
		aria-label="Search customers"
	/>
{/if}

{#if filtered.length === 0}
	<div class="card text-ink-500 p-8 text-center">
		{data.customers.length === 0 ? 'No customers yet — add your first one.' : 'No matches.'}
	</div>
{:else}
	<div class="card divide-ink-100 divide-y-2">
		{#each filtered as customer (customer.id)}
			<a
				href="/app/customers/{customer.id}"
				class="hover:bg-ink-50 flex items-center gap-3 px-4 py-3"
			>
				<div class="min-w-0 flex-1">
					<p class="truncate font-semibold">{customer.name}</p>
					<p class="text-ink-400 truncate text-sm">
						{[customer.addressLine1, customer.city].filter(Boolean).join(', ') ||
							customer.phone ||
							'No address'}
					</p>
				</div>
				{#if customer.animalNotes}
					<span class="chip-hazard shrink-0" title={customer.animalNotes}>
						<Icon name="paw" size={16} />
						<span class="hidden sm:inline">Animals</span>
					</span>
				{/if}
			</a>
		{/each}
	</div>
{/if}
