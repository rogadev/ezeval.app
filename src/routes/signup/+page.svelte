<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
	let submitting = $state(false);
	const incomplete = page.url.searchParams.has('incomplete');
</script>

<svelte:head>
	<title>Create your account — EzEval</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
	<div class="w-full max-w-md">
		<a href="/" class="mb-8 block text-center text-2xl font-bold tracking-tight text-sky-700">
			EzEval
		</a>
		<div class="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
			<h1 class="text-xl font-semibold text-slate-900">Create your account</h1>
			<p class="mt-1 text-sm text-slate-500">
				14-day free trial, then $5/month. Your default price sheet is ready the moment you sign up.
			</p>

			{#if incomplete}
				<p class="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
					Your previous signup didn't finish — please sign up again.
				</p>
			{/if}
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
					<label for="name" class="block text-sm font-medium text-slate-700">Your name</label>
					<input
						id="name"
						name="name"
						type="text"
						required
						value={form?.name ?? ''}
						class="mt-1 block w-full rounded-lg border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500"
					/>
				</div>
				<div>
					<label for="businessName" class="block text-sm font-medium text-slate-700">
						Business name
					</label>
					<input
						id="businessName"
						name="businessName"
						type="text"
						required
						value={form?.businessName ?? ''}
						class="mt-1 block w-full rounded-lg border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500"
					/>
				</div>
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
						minlength="8"
						class="mt-1 block w-full rounded-lg border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500"
					/>
					<p class="mt-1 text-xs text-slate-400">At least 8 characters.</p>
				</div>
				<button
					type="submit"
					disabled={submitting}
					class="w-full rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
				>
					{submitting ? 'Creating account…' : 'Create account'}
				</button>
			</form>
		</div>
		<p class="mt-6 text-center text-sm text-slate-500">
			Already have an account?
			<a href="/login" class="font-medium text-sky-700 hover:underline">Sign in</a>
		</p>
	</div>
</div>
