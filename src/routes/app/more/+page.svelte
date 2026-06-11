<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import type { LayoutData } from '../$types';

	let { data }: { data: LayoutData } = $props();
	const isAdmin = $derived(data.user.role === 'admin');

	const items = $derived(
		[
			{ href: '/app/customers', label: 'Customers', icon: 'users', adminOnly: false },
			{ href: '/app/team', label: 'Team', icon: 'users', adminOnly: true },
			{ href: '/app/workflows', label: 'Workflows', icon: 'workflow', adminOnly: true },
			{ href: '/app/settings', label: 'Business info', icon: 'settings', adminOnly: true },
			{ href: '/app/billing', label: 'Billing', icon: 'billing', adminOnly: true }
		].filter((i) => (!i.adminOnly || isAdmin) && (i.href !== '/app/billing' || data.billingEnabled))
	);
</script>

<svelte:head>
	<title>More — EzEval</title>
</svelte:head>

<h1 class="heading-display mb-4 text-3xl">More</h1>

<div class="card divide-ink-100 divide-y-2 overflow-hidden">
	{#each items as item (item.href)}
		<a href={item.href} class="hover:bg-ink-50 flex min-h-14 items-center gap-3 px-5 font-medium">
			<Icon name={item.icon} size={22} class="text-ink-500" />
			{item.label}
		</a>
	{/each}
</div>

<div class="card mt-6 p-5">
	<p class="font-semibold">{data.user.name}</p>
	<p class="text-ink-500 mb-1 text-sm">{data.user.email}</p>
	<span class="badge bg-ink-100 text-ink-700">{data.user.role}</span>
	<form method="POST" action="/logout" class="mt-4">
		<button type="submit" class="btn-outline w-full">
			<Icon name="logout" size={20} />
			Sign out
		</button>
	</form>
</div>
