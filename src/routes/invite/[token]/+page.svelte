<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let submitting = $state(false);

	const roleLabel: Record<string, string> = {
		admin: 'admin',
		estimator: 'estimator',
		technician: 'technician'
	};
</script>

<svelte:head>
	<title>Join your team — EzEval</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
	<div class="w-full max-w-md">
		<a href="/" class="mb-8 block text-center text-2xl font-bold tracking-tight text-sky-700">
			EzEval
		</a>
		<div class="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
			{#if !data.valid}
				<h1 class="text-xl font-semibold text-slate-900">Invite not found</h1>
				<p class="mt-2 text-sm text-slate-500">
					This invite link is invalid, expired, or already used. Ask your admin to send a new one.
				</p>
			{:else}
				<h1 class="text-xl font-semibold text-slate-900">
					Join {data.businessName}
				</h1>
				<p class="mt-1 text-sm text-slate-500">
					You've been invited as {data.role === 'admin' ? 'an' : 'a'}
					<span class="font-medium text-slate-700">{roleLabel[data.role]}</span>.
				</p>

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
						<label for="email" class="block text-sm font-medium text-slate-700">Email</label>
						<input
							id="email"
							name="email"
							type="email"
							required
							value={form?.email ?? data.email ?? ''}
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
					</div>
					<button
						type="submit"
						disabled={submitting}
						class="w-full rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
					>
						{submitting ? 'Joining…' : 'Join team'}
					</button>
				</form>
			{/if}
		</div>
	</div>
</div>
