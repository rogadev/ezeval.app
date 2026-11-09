<script lang="ts">
	import Logo from '$lib/components/Logo.svelte';
</script>

<header class="bg-ink-900 sticky top-0 z-40">
	<nav
		class="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6"
		aria-label="Main"
	>
		<a href="/" aria-label="EzEval home">
			<Logo tone="light" />
		</a>
		<div class="flex items-center gap-1 sm:gap-2">
			<a
				href="/window-cleaning-price-calculator"
				class="text-ink-200 hover:text-paper hidden rounded-lg px-3 py-2 text-[15px] font-medium md:block"
			>
				Price calculator
			</a>
			<a
				href="/how-to-price-window-cleaning"
				class="text-ink-200 hover:text-paper hidden rounded-lg px-3 py-2 text-[15px] font-medium md:block"
			>
				Pricing guide
			</a>
			<a
				href="/login"
				class="text-ink-200 hover:text-paper rounded-lg px-3 py-2 text-[15px] font-medium"
			>
				Sign in
			</a>
			<a href="/signup" class="btn-primary btn-sm">Start free trial</a>
		</div>
	</nav>
</header>
