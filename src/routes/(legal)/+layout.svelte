<script lang="ts">
	import SiteFooter from '$lib/components/SiteFooter.svelte';
	import SiteHeader from '$lib/components/SiteHeader.svelte';

	let { children } = $props();
</script>

<SiteHeader />

<main>
	<article class="legal mx-auto max-w-3xl px-4 py-12 sm:px-6">
		{@render children()}
	</article>
</main>

<SiteFooter />

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
