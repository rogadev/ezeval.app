<script lang="ts">
	let { children } = $props();
</script>

<header class="bg-ink-900 sticky top-0 z-40">
	<nav class="mx-auto flex max-w-3xl items-center justify-between px-4 py-3 sm:px-6">
		<a href="/" class="flex items-center gap-2.5">
			<span class="relative inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
				<span class="bg-brand-500 absolute h-1 w-5 -rotate-45 rounded-full"></span>
				<span class="bg-glass-400 absolute mt-2 ml-2 h-0.5 w-3.5 -rotate-45 rounded-full"></span>
			</span>
			<span class="heading-display text-paper text-2xl">EzEval</span>
		</a>
		<a href="/" class="btn-ghost !text-ink-200 hover:!bg-ink-800 hover:!text-paper">Home</a>
	</nav>
</header>

<article class="legal mx-auto max-w-3xl px-4 py-12 sm:px-6">
	{@render children()}
</article>

<footer class="bg-ink-950 text-ink-400 py-10 text-sm">
	<div class="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-4 px-4 sm:px-6">
		<p>© {new Date().getFullYear()} Roga Digital. All rights reserved.</p>
		<div class="flex gap-5">
			<a href="/terms" class="hover:text-paper">Terms</a>
			<a href="/privacy" class="hover:text-paper">Privacy</a>
		</div>
	</div>
</footer>

<style>
	.legal :global(h1) {
		font-family: var(--font-display);
		font-size: 2.5rem;
		line-height: 1.05;
		font-weight: 600;
		letter-spacing: 0.01em;
		text-transform: uppercase;
	}
	.legal :global(h2) {
		font-family: var(--font-display);
		font-size: 1.5rem;
		font-weight: 600;
		letter-spacing: 0.01em;
		margin-top: 2.25rem;
		margin-bottom: 0.5rem;
	}
	.legal :global(p) {
		margin-top: 0.75rem;
		line-height: 1.65;
		color: var(--color-ink-700);
	}
	.legal :global(ul) {
		margin-top: 0.75rem;
		padding-left: 1.25rem;
		list-style: disc;
		color: var(--color-ink-700);
	}
	.legal :global(li) {
		margin-top: 0.4rem;
		line-height: 1.6;
	}
	.legal :global(a) {
		font-weight: 600;
		text-decoration: underline;
		text-underline-offset: 2px;
	}
	.legal :global(.updated) {
		margin-top: 0.5rem;
		font-size: 0.875rem;
		color: var(--color-ink-400);
	}
</style>
