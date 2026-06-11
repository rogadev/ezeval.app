<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const firstName = $derived(data.user.name.split(' ')[0]);
</script>

<svelte:head>
	<title>Welcome aboard — EzEval</title>
</svelte:head>

<div class="mx-auto max-w-lg py-6 text-center sm:py-12">
	<!-- celebratory squeegee streaks -->
	<div class="relative mx-auto mb-6 h-20 w-20" aria-hidden="true">
		<span class="bg-ink-900 absolute inset-0 rounded-2xl"></span>
		<span
			class="bg-brand-500 absolute top-1/2 left-1/2 h-2.5 w-12 -translate-x-1/2 -translate-y-1/2 -rotate-45 rounded-full"
		></span>
		<span
			class="bg-glass-400 absolute top-1/2 left-1/2 mt-3 ml-3 h-1.5 w-8 -translate-x-1/2 -translate-y-1/2 -rotate-45 rounded-full opacity-80"
		></span>
		<span class="bg-brand-300 absolute -top-1.5 -right-1.5 h-3 w-3 rotate-12 rounded-sm"></span>
		<span class="bg-glass-300 absolute -bottom-2 -left-1 h-2.5 w-2.5 -rotate-12 rounded-full"
		></span>
		<span class="bg-brand-400 absolute top-2 -left-3 h-2 w-2 rotate-45 rounded-sm"></span>
	</div>

	<p class="badge bg-brand-500 text-ink-950">Founding crew</p>
	<h1 class="heading-display mt-3 text-4xl sm:text-5xl">You're in early, {firstName}</h1>

	<div class="card mt-6 space-y-4 p-6 text-left sm:p-8">
		<p class="text-lg font-semibold">
			Congrats — you're one of the very first businesses on EzEval.
		</p>
		<p class="text-ink-600">
			Enjoy a <strong>limited-time free membership</strong> on us. Build your price sheets, send your
			crew out, quote on the glass — everything's unlocked.
		</p>
		<p class="text-ink-600">
			We'll ask for payment details down the road, with plenty of notice before anything changes.
			Until then, it's all yours.
		</p>
	</div>

	<a href="/app" class="btn-primary mt-8 w-full !text-lg sm:w-auto sm:!px-12">
		Let's go
		<Icon name="back" size={20} class="rotate-180" />
	</a>
	<p class="text-ink-400 mt-4 text-sm">
		Your default price sheet is already set up and ready to customize.
	</p>
</div>
