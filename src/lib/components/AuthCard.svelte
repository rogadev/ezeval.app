<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		title,
		subtitle,
		children,
		footer
	}: { title: string; subtitle?: string; children: Snippet; footer?: Snippet } = $props();
</script>

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
		<a href="/" class="mb-8 flex items-center justify-center gap-2.5">
			<span class="bg-ink-900 relative inline-flex h-9 w-9 items-center justify-center rounded-lg">
				<span class="bg-brand-500 absolute h-1.5 w-6 -rotate-45 rounded-full"></span>
				<span class="bg-glass-400 absolute mt-2.5 ml-2.5 h-1 w-4 -rotate-45 rounded-full opacity-80"
				></span>
			</span>
			<span class="heading-display text-3xl">EzEval</span>
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
