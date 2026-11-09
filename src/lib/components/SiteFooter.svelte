<script lang="ts">
	import Logo from '$lib/components/Logo.svelte';
</script>

<footer class="bg-ink-950 text-ink-300 text-[15px]">
	<div class="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-[1.5fr_1fr_1fr] sm:px-6">
		<div>
			<Logo tone="light" size={28} />
			<p class="mt-3 max-w-xs">
				Tap-to-quote for window cleaning crews. Made in British Columbia by Roga Digital.
			</p>
		</div>
		<nav aria-label="Product">
			<p class="text-paper font-semibold">Product</p>
			<ul class="mt-3 space-y-2">
				<li><a href="/#pricing" class="hover:text-paper">Pricing</a></li>
				<li>
					<a href="/window-cleaning-price-calculator" class="hover:text-paper">Price calculator</a>
				</li>
				<li><a href="/how-to-price-window-cleaning" class="hover:text-paper">Pricing guide</a></li>
			</ul>
		</nav>
		<nav aria-label="Account and legal">
			<p class="text-paper font-semibold">Account</p>
			<ul class="mt-3 space-y-2">
				<li><a href="/signup" class="hover:text-paper">Start free trial</a></li>
				<li><a href="/login" class="hover:text-paper">Sign in</a></li>
				<li><a href="/terms" class="hover:text-paper">Terms</a></li>
				<li><a href="/privacy" class="hover:text-paper">Privacy</a></li>
			</ul>
		</nav>
	</div>
	<div class="border-ink-800 border-t">
		<p class="text-ink-400 mx-auto max-w-6xl px-4 py-5 text-sm sm:px-6">
			&copy; {new Date().getFullYear()} Roga Digital. All rights reserved.
		</p>
	</div>
</footer>
