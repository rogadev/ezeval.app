<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	const isAdmin = $derived(data.user.role === 'admin');
	const justSubscribed = page.url.searchParams.has('subscribed');

	const trialDaysLeft = $derived.by(() => {
		if (!data.billing.trialEndsAt) return null;
		return Math.max(
			0,
			Math.ceil((new Date(data.billing.trialEndsAt).getTime() - Date.now()) / 86_400_000)
		);
	});
</script>

<svelte:head>
	<title>Billing — EzEval</title>
</svelte:head>

<h1 class="heading-display mb-5 text-3xl">Billing</h1>

{#if justSubscribed}
	<p class="bg-glass-100 text-glass-800 mb-4 rounded-xl px-4 py-3 font-semibold">
		You're subscribed — thanks for running your business on EzEval!
	</p>
{/if}
{#if form?.message}
	<p class="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{form.message}</p>
{/if}

<div class="card p-6">
	{#if !data.billing.enabled}
		<span class="badge bg-ink-100 text-ink-600">Billing not configured</span>
		<p class="text-ink-500 mt-3 text-sm">
			Stripe keys aren't set in this environment, so the app runs unlocked. Set
			<code class="num">STRIPE_SECRET_KEY</code>, <code class="num">STRIPE_PRICE_ID</code> and
			<code class="num">STRIPE_WEBHOOK_SECRET</code> to enable subscriptions.
		</p>
	{:else if data.billing.status === 'active' || data.billing.status === 'trialing'}
		<span class="badge bg-glass-100 text-glass-800">Active</span>
		<p class="mt-3">
			Your EzEval subscription is active — <span class="num">$5/month</span>, unlimited price
			sheets, team members, and evaluations.
		</p>
	{:else if data.billing.status === 'past_due'}
		<span class="badge bg-brand-100 text-brand-900">Payment past due</span>
		<p class="mt-3">
			Your last payment didn't go through. Stripe will retry automatically — update your card to
			keep access uninterrupted.
		</p>
	{:else if data.billing.state === 'trial'}
		<span class="badge bg-brand-100 text-brand-900">Free trial</span>
		<p class="mt-3">
			{trialDaysLeft === 0
				? 'Your trial ends today.'
				: `${trialDaysLeft} day${trialDaysLeft === 1 ? '' : 's'} left in your free trial.`}
			Subscribe for <span class="num font-bold">$5/month</span> to keep your crew quoting.
		</p>
	{:else}
		<span class="badge bg-red-100 text-red-800">Subscription needed</span>
		<p class="mt-3">
			{#if isAdmin}
				Your trial has ended or your subscription lapsed. Subscribe to unlock the app — everything
				you've set up is right where you left it.
			{:else}
				This business's EzEval subscription has lapsed. Ask your admin to renew it — your work is
				safe and waiting.
			{/if}
		</p>
	{/if}

	{#if isAdmin && data.billing.enabled}
		<div class="mt-5 flex flex-wrap gap-2">
			{#if data.billing.status !== 'active' && data.billing.status !== 'trialing'}
				<form method="POST" action="?/subscribe" use:enhance>
					<button type="submit" class="btn-primary">Subscribe · $5/month</button>
				</form>
			{/if}
			{#if data.billing.hasCustomer}
				<form method="POST" action="?/portal" use:enhance>
					<button type="submit" class="btn-outline">Manage billing</button>
				</form>
			{/if}
		</div>
	{/if}
</div>

<p class="text-ink-400 mt-4 text-sm">
	One flat price. No per-seat charges, no usage tiers — built by a window cleaner, priced like one.
</p>
