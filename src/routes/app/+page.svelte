<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const firstName = $derived(data.user.name.split(' ')[0]);
</script>

<svelte:head>
	<title>Today — EzEval</title>
</svelte:head>

<h1 class="heading-display text-3xl">Hey {firstName}</h1>
<p class="text-ink-500 mt-1">Ready to walk some glass?</p>

<div class="mt-6 grid gap-4 sm:grid-cols-2">
	<a href="/app/sheets" class="card hover:border-brand-500 p-5 transition-colors">
		<h2 class="font-display text-xl font-semibold tracking-wide">Start an evaluation</h2>
		<p class="text-ink-500 mt-1 text-sm">Open a price sheet and tap your way through a property.</p>
	</a>
	<a href="/app/evaluations" class="card hover:border-brand-500 p-5 transition-colors">
		<h2 class="font-display text-xl font-semibold tracking-wide">Recent quotes</h2>
		<p class="text-ink-500 mt-1 text-sm">Review evaluations captured by your team.</p>
	</a>
</div>
