<script lang="ts">
	import { page } from '$app/state';
	import Icon from '$lib/components/Icon.svelte';
	import type { LayoutData } from './$types';
	import type { Snippet } from 'svelte';

	let { data, children }: { data: LayoutData; children: Snippet } = $props();

	const isAdmin = $derived(data.user.role === 'admin');

	type NavItem = { href: string; label: string; icon: string; adminOnly?: boolean };

	// Primary nav: the 5 most field-relevant destinations live in the mobile
	// bottom bar; everything else is under /app/more (and always visible in
	// the desktop sidebar).
	const primary: NavItem[] = [
		{ href: '/app', label: 'Today', icon: 'today' },
		{ href: '/app/map', label: 'Map', icon: 'map' },
		{ href: '/app/sheets', label: 'Sheets', icon: 'grid' },
		{ href: '/app/evaluations', label: 'Quotes', icon: 'quote' }
	];
	const secondary: NavItem[] = [
		{ href: '/app/customers', label: 'Customers', icon: 'users' },
		{ href: '/app/team', label: 'Team', icon: 'users', adminOnly: true },
		{ href: '/app/workflows', label: 'Workflows', icon: 'workflow', adminOnly: true },
		{ href: '/app/settings', label: 'Business', icon: 'settings', adminOnly: true },
		{ href: '/app/billing', label: 'Billing', icon: 'billing', adminOnly: true }
	];

	const visibleSecondary = $derived(secondary.filter((i) => !i.adminOnly || isAdmin));

	function isActive(href: string): boolean {
		if (href === '/app') return page.url.pathname === '/app';
		return page.url.pathname.startsWith(href);
	}

	const trialDaysLeft = $derived.by(() => {
		if (!data.business.trialEndsAt || data.business.subscriptionStatus) return null;
		const ms = new Date(data.business.trialEndsAt).getTime() - Date.now();
		return Math.max(0, Math.ceil(ms / 86_400_000));
	});
</script>

<div class="min-h-screen lg:flex">
	<!-- Desktop sidebar -->
	<aside
		class="bg-ink-900 text-ink-200 sticky top-0 hidden h-screen w-60 shrink-0 flex-col lg:flex"
	>
		<a href="/app" class="flex items-center gap-2.5 px-5 pt-6 pb-4">
			<span class="relative inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
				<span class="bg-brand-500 absolute h-1 w-5 -rotate-45 rounded-full"></span>
				<span class="bg-glass-400 absolute mt-2 ml-2 h-0.5 w-3.5 -rotate-45 rounded-full"></span>
			</span>
			<span class="heading-display text-paper text-2xl">EzEval</span>
		</a>
		<p class="text-ink-400 truncate px-5 pb-4 text-sm font-medium">{data.business.name}</p>

		<nav class="flex-1 space-y-0.5 px-3">
			{#each [...primary, ...visibleSecondary] as item (item.href)}
				<a
					href={item.href}
					class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] font-medium transition-colors
						{isActive(item.href) ? 'bg-brand-500 text-ink-950 font-semibold' : 'hover:bg-ink-800 hover:text-paper'}"
				>
					<Icon name={item.icon} size={20} />
					{item.label}
				</a>
			{/each}
		</nav>

		<div class="border-ink-800 border-t px-3 py-4">
			<p class="text-paper truncate px-3 text-sm font-semibold">{data.user.name}</p>
			<p class="text-ink-400 mb-2 truncate px-3 text-xs">{data.user.role}</p>
			<form method="POST" action="/logout">
				<button
					type="submit"
					class="text-ink-300 hover:bg-ink-800 hover:text-paper flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium"
				>
					<Icon name="logout" size={18} />
					Sign out
				</button>
			</form>
		</div>
	</aside>

	<div class="flex min-h-screen flex-1 flex-col">
		<!-- Mobile top bar -->
		<header
			class="bg-ink-900 text-paper sticky top-0 z-30 flex items-center justify-between px-4 py-3 lg:hidden"
		>
			<a href="/app" class="flex items-center gap-2">
				<span
					class="relative inline-flex h-7 w-7 items-center justify-center rounded-md bg-white/10"
				>
					<span class="bg-brand-500 absolute h-1 w-4.5 -rotate-45 rounded-full"></span>
					<span class="bg-glass-400 absolute mt-1.5 ml-1.5 h-0.5 w-3 -rotate-45 rounded-full"
					></span>
				</span>
				<span class="heading-display text-paper text-xl">EzEval</span>
			</a>
			<span class="text-ink-300 max-w-[50%] truncate text-sm font-medium">
				{data.business.name}
			</span>
		</header>

		{#if trialDaysLeft !== null && trialDaysLeft <= 7}
			<div class="bg-brand-500 text-ink-950 px-4 py-2 text-center text-sm font-semibold">
				{trialDaysLeft === 0 ? 'Your trial ends today' : `${trialDaysLeft} days left in your trial`}
				{#if isAdmin}— <a href="/app/billing" class="underline underline-offset-2">subscribe now</a>{/if}
			</div>
		{:else if data.business.subscriptionStatus === 'past_due'}
			<div class="px-4 py-2 text-center text-sm font-semibold text-white" style="background:#b91c1c">
				Your last payment failed — please
				{#if isAdmin}<a href="/app/billing" class="underline underline-offset-2">update your card</a
					>{:else}ask your admin to update billing{/if}
			</div>
		{/if}

		<!-- Content -->
		<main class="mx-auto w-full max-w-5xl flex-1 px-4 pt-6 pb-28 sm:px-6 lg:pb-12">
			{@render children()}
		</main>

		<!-- Mobile bottom tab bar: thumb-reach nav, 5 oversized targets -->
		<nav
			class="border-ink-200 fixed inset-x-0 bottom-0 z-30 border-t-2 bg-white pb-[env(safe-area-inset-bottom)] lg:hidden"
		>
			<div class="grid grid-cols-5">
				{#each primary as item (item.href)}
					<a
						href={item.href}
						class="flex min-h-16 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold
							{isActive(item.href) ? 'text-brand-600' : 'text-ink-500'}"
					>
						<Icon name={item.icon} size={24} />
						{item.label}
					</a>
				{/each}
				<a
					href="/app/more"
					class="flex min-h-16 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold
						{isActive('/app/more') ? 'text-brand-600' : 'text-ink-500'}"
				>
					<Icon name="more" size={24} />
					More
				</a>
			</div>
		</nav>
	</div>
</div>
