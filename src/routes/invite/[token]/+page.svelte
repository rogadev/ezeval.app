<script lang="ts">
	import { enhance } from '$app/forms';
	import AuthCard from '$lib/components/AuthCard.svelte';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let submitting = $state(false);
</script>

<svelte:head>
	<title>Join your team — EzEval</title>
</svelte:head>

{#if !data.valid}
	<AuthCard
		title="Invite not found"
		subtitle="This invite link is invalid, expired, or already used. Ask your admin to send a new one."
	>
		<a href="/" class="btn-outline mt-6 w-full">Back to home</a>
	</AuthCard>
{:else}
	<AuthCard title="Join {data.businessName}">
		<p class="text-ink-500 mt-1 text-sm">
			You've been invited as
			<span class="badge bg-ink-900 text-paper ml-0.5">{data.role}</span>
		</p>

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
				<label for="email" class="field-label">Email</label>
				<input
					id="email"
					name="email"
					type="email"
					required
					value={form?.email ?? data.email ?? ''}
					class="field"
				/>
			</div>
			<div>
				<label for="password" class="field-label">Password</label>
				<input
					id="password"
					name="password"
					type="password"
					required
					minlength="8"
					class="field"
				/>
			</div>
			<button type="submit" disabled={submitting} class="btn-primary w-full">
				{submitting ? 'Joining…' : 'Join team'}
			</button>
		</form>
	</AuthCard>
{/if}
