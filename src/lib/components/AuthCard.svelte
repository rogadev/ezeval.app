<script lang="ts">
	import Logo from '$lib/components/Logo.svelte';
	import type { Snippet } from 'svelte';

	let {
		title,
		subtitle,
		children,
		footer
	}: { title: string; subtitle?: string; children: Snippet; footer?: Snippet } = $props();
</script>

<!-- Sign-in, sign-up, and invite screens have nothing worth a search result. -->
<svelte:head><meta name="robots" content="noindex" /></svelte:head>

<div class="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
	<!-- faint glass-streak backdrop -->
	<div
		class="from-glass-200/40 pointer-events-none absolute -top-24 -right-24 h-96 w-96 rotate-12 bg-gradient-to-br to-transparent"
		aria-hidden="true"
	></div>
	<div
		class="from-brand-200/30 pointer-events-none absolute -bottom-32 -left-24 h-96 w-96 -rotate-12 bg-gradient-to-tr to-transparent"
		aria-hidden="true"
	></div>

	<div class="relative w-full max-w-md">
		<a href="/" class="mb-8 flex justify-center" aria-label="EzEval home">
			<Logo size={38} />
		</a>
		<div class="card p-6 sm:p-8">
			<h1 class="heading-display text-2xl">{title}</h1>
			{#if subtitle}
				<p class="text-ink-500 mt-1 text-sm">{subtitle}</p>
			{/if}
			{@render children()}
		</div>
		{#if footer}
			<p class="text-ink-500 mt-6 text-center text-sm">{@render footer()}</p>
		{/if}
	</div>
</div>
