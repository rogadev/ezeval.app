<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const firstName = $derived(data.user.name.split(' ')[0]);
	const isAdmin = $derived(data.user.role === 'admin');

	const dateFmt = new Intl.DateTimeFormat('en-US', {
		weekday: 'long',
		month: 'long',
		day: 'numeric'
	});

	const statusStyle: Record<string, string> = {
		scheduled: 'bg-ink-100 text-ink-700',
		in_progress: 'bg-brand-100 text-brand-900',
		completed: 'bg-glass-100 text-glass-800',
		canceled: 'bg-red-50 text-red-700'
	};
</script>

<svelte:head>
	<title>Today — EzEval</title>
</svelte:head>

<h1 class="heading-display text-3xl">Hey {firstName}</h1>
<p class="text-ink-500 mt-1">{dateFmt.format(new Date(data.today + 'T12:00:00'))}</p>

{#if data.nextJob}
	<a href="/app/tasks/{data.nextJob.id}" class="card border-brand-500 mt-5 block p-5">
		<p class="field-label text-brand-700">Next stop</p>
		<div class="flex items-center justify-between gap-3">
			<div class="min-w-0">
				<p class="font-display text-2xl font-semibold tracking-wide">
					{data.nextJob.customerName}
				</p>
				<p class="text-ink-500 truncate text-sm">
					{[data.nextJob.addressLine1, data.nextJob.city].filter(Boolean).join(', ')}
					{#if data.nextJob.fixedTime}· <span class="num">@ {data.nextJob.fixedTime}</span>{/if}
				</p>
			</div>
			<Icon name="back" size={24} class="shrink-0 rotate-180 text-brand-600" />
		</div>
		{#if data.nextJob.animalNotes}
			<p class="chip-hazard mt-3">
				<Icon name="paw" size={16} />
				{data.nextJob.animalNotes}
			</p>
		{/if}
	</a>
{/if}

<section class="mt-6">
	<div class="mb-2 flex items-center justify-between">
		<h2 class="heading-display text-ink-600 text-lg">Today's run</h2>
		<a href="/app/map" class="text-ink-500 flex items-center gap-1 text-sm font-medium underline">
			<Icon name="map" size={16} />
			Map view
		</a>
	</div>
	{#if data.todaysJobs.length === 0}
		<div class="card text-ink-500 p-6 text-center text-sm">
			Nothing scheduled today.
			{#if isAdmin}<a href="/app/tasks" class="font-semibold underline">Create a job</a>{/if}
		</div>
	{:else}
		<ol class="card divide-ink-100 divide-y-2">
			{#each data.todaysJobs as job, index (job.id)}
				<li>
					<a href="/app/tasks/{job.id}" class="hover:bg-ink-50 flex items-center gap-3 px-4 py-3">
						<span
							class="bg-ink-900 text-paper num flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm"
						>
							{index + 1}
						</span>
						<div class="min-w-0 flex-1">
							<p class="flex items-center gap-2 truncate font-semibold">
								{job.customerName}
								{#if job.animalNotes}
									<Icon name="paw" size={15} class="text-brand-600 shrink-0" />
								{/if}
							</p>
							<p class="text-ink-400 truncate text-sm">
								{#if job.fixedTime}<span class="num">@ {job.fixedTime}</span> ·{/if}
								{[job.addressLine1, job.city].filter(Boolean).join(', ') || 'No address'}
								{#if isAdmin && job.assigneeName}· {job.assigneeName}{/if}
							</p>
						</div>
						{#if job.stepsTotal > 0}
							<span class="num text-ink-400 text-xs">{job.stepsDone}/{job.stepsTotal}</span>
						{/if}
						<span class="badge {statusStyle[job.status]}">{job.status.replace('_', ' ')}</span>
					</a>
				</li>
			{/each}
		</ol>
	{/if}
</section>

<div class="mt-6 grid gap-4 sm:grid-cols-2">
	<a href="/app/sheets" class="card hover:border-brand-500 p-5 transition-colors">
		<h2 class="font-display text-xl font-semibold tracking-wide">Start an evaluation</h2>
		<p class="text-ink-500 mt-1 text-sm">Walk-up quote? Open a sheet and capture it on the spot.</p>
	</a>
	<a href="/app/evaluations" class="card hover:border-brand-500 p-5 transition-colors">
		<h2 class="font-display text-xl font-semibold tracking-wide">Recent quotes</h2>
		<p class="text-ink-500 mt-1 text-sm">Review evaluations captured by your team.</p>
	</a>
</div>
