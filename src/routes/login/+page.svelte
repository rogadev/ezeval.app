<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
	let submitting = $state(false);
</script>

<svelte:head>
	<title>Sign in — EzEval</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
	<div class="w-full max-w-md">
		<a href="/" class="mb-8 block text-center text-2xl font-bold tracking-tight text-sky-700">
			EzEval
		</a>
		<div class="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
			<h1 class="text-xl font-semibold text-slate-900">Sign in</h1>

			{#if form?.message}
				<p class="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{form.message}</p>
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
					<label for="email" class="block text-sm font-medium text-slate-700">Email</label>
					<input
						id="email"
						name="email"
						type="email"
						required
						value={form?.email ?? ''}
						class="mt-1 block w-full rounded-lg border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500"
					/>
				</div>
				<div>
					<label for="password" class="block text-sm font-medium text-slate-700">Password</label>
					<input
						id="password"
						name="password"
						type="password"
						required
						class="mt-1 block w-full rounded-lg border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500"
					/>
				</div>
				<button
					type="submit"
					disabled={submitting}
					class="w-full rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
				>
					{submitting ? 'Signing in…' : 'Sign in'}
				</button>
			</form>
		</div>
		<p class="mt-6 text-center text-sm text-slate-500">
			New to EzEval?
			<a href="/signup" class="font-medium text-sky-700 hover:underline">Create an account</a>
		</p>
	</div>
</div>
