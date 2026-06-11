<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import Icon from '$lib/components/Icon.svelte';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let copiedToken = $state('');

	function inviteUrl(token: string): string {
		return `${page.url.origin}/invite/${token}`;
	}
	async function copy(token: string) {
		await navigator.clipboard.writeText(inviteUrl(token));
		copiedToken = token;
		setTimeout(() => (copiedToken = ''), 2000);
	}
</script>

<svelte:head>
	<title>Team — EzEval</title>
</svelte:head>

<h1 class="heading-display mb-5 text-3xl">Team</h1>

<div class="card divide-ink-100 divide-y-2">
	{#each data.members as member (member.id)}
		<div class="flex items-center gap-3 px-4 py-3">
			<div class="min-w-0 flex-1">
				<p class="truncate font-semibold">{member.name}</p>
				<p class="text-ink-400 truncate text-sm">{member.email}</p>
			</div>
			<span
				class="badge {member.role === 'admin'
					? 'bg-ink-900 text-paper'
					: 'bg-ink-100 text-ink-700'}"
			>
				{member.role}
			</span>
		</div>
	{/each}
</div>

<div class="card mt-6 p-5">
	<h2 class="heading-display text-lg">Invite a teammate</h2>
	<p class="text-ink-500 mt-0.5 text-sm">
		Estimators and technicians use your price sheets under the visibility rules you set — they never
		see what you don't want them to.
	</p>

	{#if form && 'message' in form && form.message}
		<p class="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
			{form.message}
		</p>
	{/if}

	<form method="POST" action="?/invite" class="mt-4 flex flex-col gap-2 sm:flex-row" use:enhance>
		<select name="role" class="field sm:w-44" required>
			<option value="estimator">Estimator</option>
			<option value="technician">Technician</option>
			<option value="admin">Admin</option>
		</select>
		<input
			name="email"
			type="email"
			placeholder="Email (optional, prefills their signup)"
			class="field flex-1"
		/>
		<button type="submit" class="btn-dark">
			<Icon name="plus" size={20} />
			Create invite
		</button>
	</form>
</div>

{#if data.invites.length}
	<div class="card mt-6 divide-ink-100 divide-y-2">
		{#each data.invites as invite (invite.id)}
			<div class="flex flex-wrap items-center gap-2 px-4 py-3">
				<span class="badge bg-brand-100 text-brand-900">{invite.role}</span>
				<span class="text-ink-500 min-w-0 flex-1 truncate text-sm">
					{invite.email ?? inviteUrl(invite.token)}
				</span>
				<button
					type="button"
					class="btn-outline min-h-10 px-3 text-sm"
					onclick={() => copy(invite.token)}
				>
					{copiedToken === invite.token ? 'Copied!' : 'Copy link'}
				</button>
				<form method="POST" action="?/revoke" use:enhance>
					<input type="hidden" name="id" value={invite.id} />
					<button
						type="submit"
						class="btn-ghost min-h-10 px-3 text-red-600"
						aria-label="Revoke invite"
					>
						<Icon name="x" size={18} />
					</button>
				</form>
			</div>
		{/each}
	</div>
{/if}
