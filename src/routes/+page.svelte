<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';

	const demoRows = [
		{
			label: 'Special',
			buttons: [
				{ l: 'Skylight', c: 0 },
				{ l: 'French', c: 14 }
			]
		},
		{
			label: 'High Level',
			buttons: [
				{ l: 'Small', c: 0 },
				{ l: 'Medium', c: 2 },
				{ l: 'Large', c: 3 }
			]
		},
		{
			label: 'Ground Level',
			buttons: [
				{ l: 'Small', c: 6 },
				{ l: 'Medium', c: 2 },
				{ l: 'Large', c: 0 }
			]
		}
	];

	const features = [
		{
			icon: 'grid',
			title: 'Price sheets that work like you do',
			body: 'Rows by access level — roof rope work down to walk-up glass. Your buttons, your labels, your prices. Build as many sheets as you have kinds of work: residential, commercial, post-construction.'
		},
		{
			icon: 'route',
			title: 'Runs that loop, not zig-zag',
			body: 'Assign a day of estimates and EzEval orders the stops into one clean ring around town. Fixed-time appointments stay fixed; everyone else slots in around them.'
		},
		{
			icon: 'check',
			title: 'Your process, enforced',
			body: '"Call the customer 25 minutes out." Define the workflow once and every job carries the checklist. You\'ll know the plan was followed without asking.'
		},
		{
			icon: 'paw',
			title: 'No surprise rottweilers',
			body: 'Animals on property are a first-class field on every customer — your crew sees the warning before they open the gate, every time.'
		}
	];
</script>

<svelte:head>
	<title>EzEval — Tap-to-quote for window cleaning crews</title>
	<meta
		name="description"
		content="The field quoting tool for window cleaning businesses. Tap buttons on-site, capture itemized evaluations, protect your pricing from leaking — $5/month flat."
	/>
</svelte:head>

<!-- NAV -->
<header class="bg-ink-900 sticky top-0 z-40">
	<nav class="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
		<a href="/" class="flex items-center gap-2.5">
			<span class="relative inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
				<span class="bg-brand-500 absolute h-1 w-5 -rotate-45 rounded-full"></span>
				<span class="bg-glass-400 absolute mt-2 ml-2 h-0.5 w-3.5 -rotate-45 rounded-full"></span>
			</span>
			<span class="heading-display text-paper text-2xl">EzEval</span>
		</a>
		<div class="flex items-center gap-2">
			<a href="/login" class="btn-ghost !text-ink-200 hover:!bg-ink-800 hover:!text-paper">
				Sign in
			</a>
			<a href="/signup" class="btn-primary !min-h-10 !px-4">Start free</a>
		</div>
	</nav>
</header>

<!-- HERO -->
<section class="bg-ink-900 relative overflow-hidden">
	<!-- glass streak backdrop -->
	<div class="pointer-events-none absolute inset-0" aria-hidden="true">
		<div
			class="from-glass-500/15 absolute -top-32 right-[10%] h-[32rem] w-40 rotate-[30deg] bg-gradient-to-b to-transparent"
		></div>
		<div
			class="from-brand-500/15 absolute -top-20 right-[24%] h-[28rem] w-24 rotate-[30deg] bg-gradient-to-b to-transparent"
		></div>
		<div
			class="absolute -top-24 right-[36%] h-[30rem] w-12 rotate-[30deg] bg-gradient-to-b from-white/5 to-transparent"
		></div>
	</div>

	<div
		class="relative mx-auto grid max-w-6xl gap-12 px-4 pt-14 pb-20 sm:px-6 lg:grid-cols-2 lg:items-center lg:pt-20 lg:pb-28"
	>
		<div>
			<p class="badge bg-brand-500 text-ink-950 mb-5">Built by a window cleaner</p>
			<h1 class="heading-display text-paper text-5xl leading-[0.95] sm:text-6xl lg:text-7xl">
				Quote it on the glass.<br />
				<span class="text-brand-400">Not on paper.</span>
			</h1>
			<p class="text-ink-300 mt-6 max-w-xl text-lg">
				Walk the property, tap the windows, hand over the number. EzEval turns your price sheet
				into a field tool your whole crew can use — without ever exposing what's on it.
			</p>
			<div class="mt-8 flex flex-wrap items-center gap-3">
				<a href="/signup" class="btn-primary !min-h-14 !px-8 !text-lg">Start 14-day free trial</a>
				<span class="text-ink-400 text-sm">then $5/month flat · cancel anytime</span>
			</div>
		</div>

		<!-- Phone mock of the tap tool -->
		<div class="mx-auto w-full max-w-sm">
			<div
				class="border-ink-700 bg-paper rotate-1 rounded-[2rem] border-4 p-4 shadow-2xl transition-transform duration-300 hover:rotate-0"
			>
				<div class="card mb-4 flex items-center justify-between px-4 py-2.5">
					<div>
						<p class="field-label !mb-0 !text-[10px]">Panes</p>
						<p class="num text-xl">27</p>
					</div>
					<div class="text-right">
						<p class="field-label !mb-0 !text-[10px]">Running total</p>
						<p class="num text-glass-700 text-xl">$150.00</p>
					</div>
				</div>
				{#each demoRows as row (row.label)}
					<p class="heading-display text-ink-600 mt-3 mb-1.5 text-sm">{row.label}</p>
					<div class="grid grid-cols-3 gap-1.5">
						{#each row.buttons as button (button.l)}
							<div
								class="card relative flex min-h-14 items-center justify-center px-1 text-sm font-semibold"
							>
								{button.l}
								{#if button.c > 0}
									<span
										class="bg-brand-500 text-ink-950 num absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs"
									>
										{button.c}
									</span>
								{/if}
							</div>
						{/each}
					</div>
				{/each}
				<div class="btn-primary pointer-events-none mt-4 w-full">Save evaluation</div>
			</div>
		</div>
	</div>
</section>

<!-- THE PITCH: pricing IP protection -->
<section class="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
	<div class="grid gap-10 lg:grid-cols-2 lg:items-center">
		<div>
			<h2 class="heading-display text-4xl sm:text-5xl">
				Send the new guy.<br />
				<span class="text-brand-600">Keep the price sheet.</span>
			</h2>
			<p class="text-ink-600 mt-5 max-w-xl text-lg">
				Your pricing took years to dial in. Hand it to a $15/hour estimator and you've trained your
				next competitor. EzEval splits the difference: they collect the metrics, you control who
				sees the money.
			</p>
		</div>
		<div class="space-y-3">
			<div class="card flex gap-4 p-5">
				<span class="badge bg-ink-900 text-paper h-fit shrink-0">Metrics only</span>
				<p class="text-ink-600 text-sm">
					Estimators see counts, heights, and sizes — <strong>no dollar amounts anywhere</strong>.
					You price the job back at the office.
				</p>
			</div>
			<div class="card flex gap-4 p-5">
				<span class="badge bg-brand-500 text-ink-950 h-fit shrink-0">Grand total</span>
				<p class="text-ink-600 text-sm">
					They can quote on the doorstep, but only ever see the final number — never per-button
					prices.
				</p>
			</div>
			<div class="card flex gap-4 p-5">
				<span class="badge bg-glass-600 h-fit shrink-0 text-white">Minimum quote</span>
				<p class="text-ink-600 text-sm">
					A floor (say, $150) means nobody can tap one button and read your unit price off the
					total. It's also just good business.
				</p>
			</div>
		</div>
	</div>
</section>

<!-- FEATURES -->
<section class="bg-ink-900 py-16 lg:py-24">
	<div class="mx-auto max-w-6xl px-4 sm:px-6">
		<h2 class="heading-display text-paper text-4xl">Everything the truck needs</h2>
		<div class="mt-10 grid gap-6 sm:grid-cols-2">
			{#each features as feature (feature.title)}
				<div class="rounded-2xl border-2 border-white/10 bg-white/5 p-6">
					<span
						class="bg-brand-500 text-ink-950 inline-flex h-11 w-11 items-center justify-center rounded-xl"
					>
						<Icon name={feature.icon} size={24} />
					</span>
					<h3 class="font-display text-paper mt-4 text-2xl font-semibold tracking-wide">
						{feature.title}
					</h3>
					<p class="text-ink-300 mt-2 text-sm leading-relaxed">{feature.body}</p>
				</div>
			{/each}
		</div>
	</div>
</section>

<!-- PRICING -->
<section class="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
	<div class="card mx-auto max-w-lg p-8 text-center">
		<p class="badge bg-glass-100 text-glass-800">Flat pricing</p>
		<p class="mt-4">
			<span class="num text-6xl font-bold">$5</span>
			<span class="text-ink-500">/month per business</span>
		</p>
		<ul class="text-ink-600 mx-auto mt-6 max-w-xs space-y-2 text-left text-sm">
			{#each ['Unlimited price sheets & evaluations', 'Unlimited estimators & technicians', 'Route optimization included', 'No per-seat charges, no tiers'] as line (line)}
				<li class="flex items-start gap-2">
					<Icon name="check" size={18} class="text-glass-600 mt-0.5 shrink-0" />
					{line}
				</li>
			{/each}
		</ul>
		<a href="/signup" class="btn-primary mt-8 w-full !text-lg">Start your free trial</a>
		<p class="text-ink-400 mt-3 text-xs">14 days free. No card required to start.</p>
	</div>
</section>

<!-- FOOTER -->
<footer class="bg-ink-950 text-ink-400 py-10 text-sm">
	<div class="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 sm:px-6">
		<p>© {new Date().getFullYear()} EzEval · ezeval.app</p>
		<div class="flex gap-5">
			<a href="/login" class="hover:text-paper">Sign in</a>
			<a href="/signup" class="hover:text-paper">Create account</a>
		</div>
	</div>
</footer>
