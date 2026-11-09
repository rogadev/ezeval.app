<script lang="ts">
	/**
	 * The EzEval mark: a squeegee swipe across a pane. Same artwork as the
	 * favicon, so the tab icon and the on-page logo always match.
	 */
	let {
		size = 32,
		tone = 'dark',
		wordmark = true,
		class: className = ''
	}: {
		/** Mark height in pixels. The wordmark scales with it. */
		size?: number;
		/** `dark` sits on paper surfaces, `light` on ink surfaces. */
		tone?: 'dark' | 'light';
		wordmark?: boolean;
		class?: string;
	} = $props();
</script>

<span class="inline-flex items-center {className}" style="gap: {size * 0.3}px">
	<svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" class="shrink-0">
		<rect
			width="64"
			height="64"
			rx="14"
			fill={tone === 'light' ? 'var(--color-ink-800)' : 'var(--color-ink-900)'}
		/>
		<path d="M10 44 L44 10 L54 10 L54 20 L20 54 L10 54 Z" fill="var(--color-brand-500)" />
		<path d="M10 34 L34 10 L40 10 L10 40 Z" fill="var(--color-glass-400)" opacity="0.85" />
	</svg>
	{#if wordmark}
		<span
			class="font-display leading-none font-bold tracking-wide uppercase {tone === 'light'
				? 'text-paper'
				: 'text-ink-900'}"
			style="font-size: {size * 0.75}px"
		>
			EzEval
		</span>
	{/if}
</span>
