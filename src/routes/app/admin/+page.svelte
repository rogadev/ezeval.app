<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const m = $derived(data.metrics);

	const money = (cents: number) =>
		'$' +
		(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

	const dateFmt = new Intl.DateTimeFormat('en-US', {
		month: 'short',
		day: 'numeric',
		hour: 'numeric',
		minute: '2-digit'
	});

	// Scale signup bars to the busiest day in the window.
	const peakSignups = $derived(Math.max(1, ...m.signupsDaily.map((d) => d.count)));
</script>

<svelte:head>
	<title>Admin metrics — EzEval</title>
</svelte:head>

{#snippet stat(label: string, value: string, sub?: string, accent?: boolean)}
	<div class="card p-4">
		<p class="field-label text-ink-500">{label}</p>
		<p class="num mt-1 text-3xl font-semibold {accent ? 'text-brand-700' : ''}">{value}</p>
		{#if sub}<p class="text-ink-400 mt-0.5 text-xs">{sub}</p>{/if}
	</div>
{/snippet}

<div class="flex items-end justify-between gap-3">
	<h1 class="heading-display text-3xl">Admin metrics</h1>
	<p class="text-ink-400 text-xs">as of {dateFmt.format(new Date(m.generatedAt))}</p>
</div>
<p class="text-ink-500 mt-1 text-sm">
	Platform-wide, across every business. The demo/comped account is excluded from customer, revenue,
	and active-usage figures.
</p>

<!-- Businesses -->
<h2 class="heading-display text-ink-600 mt-8 mb-2 text-lg">Businesses</h2>
<div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
	{@render stat('Real customers', String(m.businesses.real))}
	{@render stat('Demo / comped', String(m.businesses.comped))}
	{@render stat('New · 7 days', String(m.businesses.signups7d))}
	{@render stat('New · 30 days', String(m.businesses.signups30d))}
</div>

<!-- Subscriptions -->
<h2 class="heading-display text-ink-600 mt-8 mb-2 text-lg">Subscriptions</h2>
<div class="grid grid-cols-2 gap-3 sm:grid-cols-5">
	{@render stat('Paying', String(m.businesses.activePaying), 'active subs')}
	{@render stat('Trialing', String(m.businesses.trialing))}
	{@render stat('Past due', String(m.businesses.pastDue))}
	{@render stat('Canceled', String(m.businesses.canceled))}
	{@render stat('Never subbed', String(m.businesses.neverSubscribed))}
</div>

<!-- Active usage -->
<h2 class="heading-display text-ink-600 mt-8 mb-2 text-lg">Active usage</h2>
<p class="text-ink-400 -mt-1 mb-2 text-xs">
	Distinct real users who logged in or captured a quote in the window.
</p>
<div class="grid grid-cols-3 gap-3">
	{@render stat('DAU', String(m.activity.dau), 'last 24h')}
	{@render stat('WAU', String(m.activity.wau), 'last 7 days')}
	{@render stat('MAU', String(m.activity.mau), 'last 30 days')}
</div>

<!-- Evaluations -->
<h2 class="heading-display text-ink-600 mt-8 mb-2 text-lg">Evaluations</h2>
<div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
	{@render stat('Total quotes', String(m.evaluations.total))}
	{@render stat('Last 30 days', String(m.evaluations.last30d))}
	{@render stat('Total quoted', money(m.evaluations.totalQuotedCents))}
</div>

<!-- Revenue & costs -->
<h2 class="heading-display text-ink-600 mt-8 mb-2 text-lg">Revenue &amp; costs</h2>
<div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
	{@render stat(
		'MRR',
		m.revenue.mrrCents === null ? '—' : money(m.revenue.mrrCents),
		m.revenue.mrrCents === null
			? data.billingEnabled
				? 'unavailable'
				: 'billing off'
			: 'from Stripe'
	)}
	{@render stat('Fixed costs', money(m.revenue.fixedCostsCents), 'per month')}
	{@render stat('Stripe fees', money(m.revenue.stripeFeesCents), 'estimated')}
	{@render stat(
		'Net',
		m.revenue.netCents === null ? '—' : money(m.revenue.netCents),
		'revenue − costs',
		m.revenue.netCents !== null && m.revenue.netCents >= 0
	)}
</div>
<div class="card mt-3 p-4">
	<p class="field-label text-ink-500 mb-2">Fixed cost breakdown</p>
	<ul class="divide-ink-100 divide-y text-sm">
		{#each m.revenue.fixedCostLines as line (line.label)}
			<li class="flex items-center justify-between py-1.5">
				<span>{line.label}</span>
				<span class="num">{money(line.cents)}</span>
			</li>
		{/each}
	</ul>
	<p class="text-ink-400 mt-3 text-xs">
		Cost figures are placeholders — edit <code class="num">src/lib/server/costs.ts</code> with your real
		monthly bills.
	</p>
</div>

<!-- Signups over time -->
<h2 class="heading-display text-ink-600 mt-8 mb-2 text-lg">Signups · last 30 days</h2>
<div class="card p-4">
	{#if m.signupsDaily.length === 0}
		<p class="text-ink-400 text-sm">No signups in the last 30 days.</p>
	{:else}
		<ul class="space-y-1.5">
			{#each m.signupsDaily as day (day.date)}
				<li class="flex items-center gap-3">
					<span class="num text-ink-400 w-20 shrink-0 text-xs">{day.date.slice(5)}</span>
					<span
						class="bg-brand-500 h-4 rounded-sm"
						style="width: {(day.count / peakSignups) * 100}%; min-width: 0.5rem"
					></span>
					<span class="num text-ink-500 text-xs">{day.count}</span>
				</li>
			{/each}
		</ul>
	{/if}
</div>
