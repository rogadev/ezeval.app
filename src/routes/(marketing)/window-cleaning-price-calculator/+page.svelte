<script lang="ts">
	import Seo from '$lib/components/Seo.svelte';
	import TapDemo from '$lib/components/TapDemo.svelte';
	import { TRIAL_DAYS } from '$lib/site';

	const description =
		'Free window cleaning price calculator. Set a price per window by size and access level, add a setup fee and a minimum, then tap out an itemized estimate.';
</script>

<Seo
	title="Window cleaning price calculator, free | EzEval"
	{description}
	path="/window-cleaning-price-calculator"
/>

<section class="bg-ink-900">
	<div class="mx-auto max-w-6xl px-4 pt-12 pb-14 sm:px-6 lg:pt-16">
		<h1 class="heading-display text-paper max-w-3xl text-5xl leading-[0.95] sm:text-6xl">
			Window cleaning price calculator
		</h1>
		<p class="text-ink-200 mt-5 max-w-2xl text-lg leading-relaxed">
			Put in what you charge per window, tap what's on the house, and read off an itemized estimate.
			It's free, there's no sign-up, and nothing you type leaves this page.
		</p>
	</div>
</section>
<div class="tape" aria-hidden="true"></div>

<section class="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:py-16">
	<TapDemo editable />
	<p class="text-ink-600 mt-6 max-w-2xl text-sm leading-relaxed">
		The starting numbers are an example sheet, not a market rate. Prices vary a lot by region,
		building, and how you work, so replace them with your own.
	</p>
</section>

<section class="border-ink-200 border-y-2 bg-white">
	<div class="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:py-20">
		<h2 class="heading-display text-4xl leading-none">How the estimate adds up</h2>
		<div class="text-ink-700 mt-6 space-y-4 text-lg leading-relaxed">
			<p>
				Every button is one kind of window at one price. Most are a flat price per window. Some,
				like French panes, are priced per pane because one door can hold fifteen small pieces of
				glass.
			</p>
			<p>
				The rows are access levels, because reach is what changes the labor. Ground-level glass you
				walk up to. Mid-level usually means a water-fed pole. High-level means the roof, an anchor,
				and a rope, so it costs the most.
			</p>
		</div>

		<h3 class="font-display mt-10 text-2xl font-semibold tracking-wide">The math, in order</h3>
		<ol class="text-ink-700 mt-4 list-decimal space-y-3 pl-6 text-lg leading-relaxed">
			<li>Each line is the button's price times the number of taps.</li>
			<li>
				The setup fee is added once per job. It covers the overhead of getting boots on the ground:
				advertising, estimating, travel.
			</li>
			<li>
				If the result is under your minimum quote, the minimum is the total. No job goes out below
				it.
			</li>
		</ol>
		<p class="text-ink-700 mt-6 text-lg leading-relaxed">
			Sales tax is left out here because it depends on where you work. In the app you set your own
			tax lines and they're added to every saved evaluation.
		</p>
		<p class="mt-6">
			<a
				href="/how-to-price-window-cleaning"
				class="text-ink-900 text-lg font-semibold underline decoration-2 underline-offset-4"
			>
				Read the full guide to building a price sheet
			</a>
		</p>
	</div>
</section>

<section class="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:py-20">
	<h2 class="heading-display text-4xl leading-none">Keep the sheet, hand off the counting</h2>
	<p class="text-ink-700 mt-5 text-lg leading-relaxed">
		This calculator forgets everything when you close the tab. EzEval keeps your sheets, your
		customers, and every saved evaluation, and lets an estimator tap out a job without seeing your
		prices. Switch "Who's holding the phone?" above to see what they'd see.
	</p>
	<div class="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3">
		<a href="/signup" class="btn-primary btn-lg">Start your {TRIAL_DAYS}-day trial</a>
		<p class="text-ink-600 text-[15px]">
			No card to start. <span class="num">$5</span> a month after that.
		</p>
	</div>
</section>
