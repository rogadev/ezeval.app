<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import AuthCard from '$lib/components/AuthCard.svelte';
	import { TRIAL_DAYS } from '$lib/site';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
	let submitting = $state(false);
	const incomplete = page.url.searchParams.has('incomplete');

	let showPassword = $state(false);
</script>

<svelte:head>
	<title>Create your account — EzEval</title>
</svelte:head>

<AuthCard
	title="Create your account"
	subtitle="{TRIAL_DAYS} days free, no card needed. Your starter price sheet is ready the moment you sign up."
>
	{#if incomplete}
		<p class="bg-brand-50 text-brand-900 mt-4 rounded-xl px-4 py-3 text-sm font-medium">
			Your previous signup didn't finish — please sign up again.
		</p>
	{/if}
	{#if form?.message}
		<p class="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
			{form.message}
		</p>
	{/if}

	<form
		method="POST"
		class="mt-6 space-y-4"
		use:enhance={() => {
			submitting = true;
			return async ({ update }) => {
				submitting = false;
				await update();
			};
		}}
	>
		<div>
			<label for="name" class="field-label">Your name</label>
			<input id="name" name="name" type="text" required value={form?.name ?? ''} class="field" />
		</div>
		<div>
			<label for="businessName" class="field-label">Business name</label>
			<input
				id="businessName"
				name="businessName"
				type="text"
				required
				value={form?.businessName ?? ''}
				class="field"
			/>
		</div>
		<div>
			<label for="email" class="field-label">Email</label>
			<input
				id="email"
				name="email"
				type="email"
				required
				value={form?.email ?? ''}
				class="field"
			/>
		</div>
		<div>
			<div class="flex items-baseline justify-between">
				<label for="password" class="field-label">Password</label>
				<!-- The label carries the state, so there's no aria-pressed. The before: layer
				     widens the touch target to at least 44px without shifting the row. -->
				<button
					type="button"
					class="text-ink-600 hover:text-ink-900 relative text-sm font-medium underline underline-offset-2 before:absolute before:-inset-x-2 before:-inset-y-3"
					aria-controls="password"
					onclick={() => (showPassword = !showPassword)}
				>
					{showPassword ? 'Hide' : 'Show'}<span class="sr-only"> password</span>
				</button>
			</div>
			<input
				id="password"
				name="password"
				type={showPassword ? 'text' : 'password'}
				required
				minlength="8"
				autocomplete="new-password"
				class="field"
			/>
			<p class="text-ink-600 mt-1 text-xs">At least 8 characters.</p>
		</div>
		<button type="submit" disabled={submitting} class="btn-primary w-full">
			{submitting ? 'Creating account…' : 'Create account'}
		</button>
		<p class="text-ink-400 text-center text-xs">
			By creating an account you agree to the
			<a href="/terms" class="underline underline-offset-2">Terms of Service</a>
			and
			<a href="/privacy" class="underline underline-offset-2">Privacy Policy</a>.
		</p>
	</form>

	{#snippet footer()}
		Already have an account?
		<a href="/login" class="text-ink-800 font-semibold underline decoration-2 underline-offset-2">
			Sign in
		</a>
	{/snippet}
</AuthCard>
