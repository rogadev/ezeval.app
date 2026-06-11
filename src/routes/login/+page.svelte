<script lang="ts">
	import { enhance } from '$app/forms';
	import AuthCard from '$lib/components/AuthCard.svelte';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
	let submitting = $state(false);
</script>

<svelte:head>
	<title>Sign in — EzEval</title>
</svelte:head>

<AuthCard title="Sign in" subtitle="Good to see you back on the glass.">
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
			<label for="password" class="field-label">Password</label>
			<input id="password" name="password" type="password" required class="field" />
		</div>
		<button type="submit" disabled={submitting} class="btn-primary w-full">
			{submitting ? 'Signing in…' : 'Sign in'}
		</button>
	</form>

	{#snippet footer()}
		New to EzEval?
		<a href="/signup" class="text-ink-800 font-semibold underline decoration-2 underline-offset-2">
			Create an account
		</a>
	{/snippet}
</AuthCard>
