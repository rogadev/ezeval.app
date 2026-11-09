<script lang="ts">
	import { SITE_NAME, absoluteUrl } from '$lib/site';

	let {
		title,
		description,
		path,
		noindex = false,
		jsonLd
	}: {
		title: string;
		description?: string;
		/** Site-relative path of this page, for the canonical URL. Omit on noindex pages. */
		path?: string;
		noindex?: boolean;
		/** Structured data object, serialized as JSON-LD. */
		jsonLd?: Record<string, unknown>;
	} = $props();

	const url = $derived(path ? absoluteUrl(path) : undefined);
	const image = absoluteUrl('/og.png');

	// "<" is escaped so no value can close the script element early.
	const jsonLdTag = $derived(
		jsonLd
			? `<script type="application/ld+json">${JSON.stringify(jsonLd).replaceAll('<', '\\u003c')}</` +
					'script>'
			: ''
	);
</script>

<svelte:head>
	<title>{title}</title>
	{#if description}
		<meta name="description" content={description} />
	{/if}
	{#if noindex}
		<meta name="robots" content="noindex, nofollow" />
	{:else}
		{#if url}
			<link rel="canonical" href={url} />
			<meta property="og:url" content={url} />
		{/if}
		<meta property="og:type" content="website" />
		<meta property="og:site_name" content={SITE_NAME} />
		<meta property="og:title" content={title} />
		{#if description}
			<meta property="og:description" content={description} />
			<meta name="twitter:description" content={description} />
		{/if}
		<meta property="og:image" content={image} />
		<meta property="og:image:width" content="1200" />
		<meta property="og:image:height" content="630" />
		<meta name="twitter:card" content="summary_large_image" />
		<meta name="twitter:title" content={title} />
		<meta name="twitter:image" content={image} />
	{/if}
	{#if jsonLdTag}
		<!-- eslint-disable-next-line svelte/no-at-html-tags -- serialized from a typed object, "<" escaped -->
		{@html jsonLdTag}
	{/if}
</svelte:head>
