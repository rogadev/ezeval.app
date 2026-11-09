<script lang="ts">
	import originalTool from '$lib/assets/original-quote-tool-2021.png';
	import Icon from '$lib/components/Icon.svelte';
	import ObfuscatedEmail from '$lib/components/ObfuscatedEmail.svelte';
	import Seo from '$lib/components/Seo.svelte';
	import TapDemo from '$lib/components/TapDemo.svelte';
	import { SITE_URL, TRIAL_DAYS } from '$lib/site';

	const description =
		'Walk the property, tap each window, and get an itemized window cleaning quote on site. ' +
		`Your crew can count the job without seeing your prices. ${TRIAL_DAYS} days free, then $5 a month.`;

	const visibilityModes = [
		{
			name: 'Counts only',
			body: 'Estimators record heights, sizes, and counts. No dollar amount reaches their phone. You price the job back at the office.'
		},
		{
			name: 'Total only',
			body: 'They can quote on the doorstep, but they see one number: the grand total. Never a price per button.'
		},
		{
			name: 'Minimum quote',
			body: 'Set a floor, say $150, and nobody can tap one button to read your unit price off the total. It is also good business.'
		}
	];

	const steps = [
		{
			title: 'Build your sheet',
			body: 'Rows by access level, your buttons, your prices. Keep separate sheets for residential, commercial, and post-construction, or start from the one that comes with your account.'
		},
		{
			title: 'Walk and tap',
			body: 'One tap per window as you go around the building. Your setup fee and minimum quote apply on their own, so nobody has to remember them.'
		},
		{
			title: 'Save the evaluation',
			body: 'EzEval prices the count from your sheet, adds your sales tax, and saves the itemized evaluation for you to review.'
		}
	];

	const faqs = [
		{
			q: 'Can my estimators see my prices?',
			a: 'Only if you let them. Each price sheet has its own setting: counts only, or grand total only. Quotes are priced on our server, and your per-button prices are never sent to an estimator’s phone, so there is nothing for them to dig out of the app.'
		},
		{
			q: `What happens after the ${TRIAL_DAYS} days?`,
			a: 'You subscribe for $5 a month to keep using it. You don’t enter a card to start the trial, so nothing is charged unless you choose to subscribe.'
		},
		{
			q: 'Does it send the quote to my customer?',
			a: 'Not yet. EzEval saves the itemized evaluation with tax, and you send the quote the way you do today.'
		},
		{
			q: 'Does it work without cell signal?',
			a: 'You need a connection to open a sheet and to save. In between, your count is kept on the phone, so a dropped signal or a closed tab doesn’t lose the walk-through.'
		},
		{
			q: 'I don’t clean windows. Can I use it?',
			a: 'A price sheet is whatever rows, buttons, and prices you set up, so it works for any job you price by counting things. It was built for window cleaning first, and the starter sheet shows it.'
		},
		{
			q: 'Which sales taxes does it handle?',
			a: 'You set your own tax lines and rates, including three-decimal rates like Quebec’s QST. Each tax applies to the same base amount.'
		}
	];

	const jsonLd = {
		'@context': 'https://schema.org',
		'@type': 'SoftwareApplication',
		name: 'EzEval',
		url: `${SITE_URL}/`,
		applicationCategory: 'BusinessApplication',
		operatingSystem: 'Web',
		description,
		publisher: { '@type': 'Organization', name: 'Roga Digital' }
	};
</script>

<Seo title="Window cleaning quoting app for crews | EzEval" {description} path="/" {jsonLd} />

<!-- HERO: the headline and the working tool -->
<section class="bg-ink-900">
	<div
		class="mx-auto grid max-w-6xl gap-10 px-4 pt-12 pb-16 sm:px-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,26rem)] lg:gap-14 lg:pt-20 lg:pb-24"
	>
		<div class="lg:pt-8">
			<h1 class="heading-display text-paper text-5xl leading-[0.95] sm:text-6xl lg:text-7xl">
				Quote window cleaning jobs on the glass, not on paper.
			</h1>
			<p class="text-ink-200 mt-6 max-w-xl text-lg leading-relaxed">
				Walk the property, tap each window, and hand over the number. EzEval turns your price sheet
				into a tool your whole crew can use, without showing them what's on it.
			</p>
			<div class="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
				<a href="/signup" class="btn-primary btn-lg">Start your {TRIAL_DAYS}-day trial</a>
				<p class="text-ink-300 text-[15px]">
					No card to start.<br />
					<span class="num">$5</span> a month after that, per business.
				</p>
			</div>
		</div>

		<div>
			<p class="text-ink-200 mb-3 text-[15px]">
				<strong class="text-paper font-semibold">This one works.</strong> Tap a window, then switch who's
				holding the phone.
			</p>
			<TapDemo />
		</div>
	</div>
</section>
<div class="tape" aria-hidden="true"></div>

<!-- PRICE PRIVACY: the reason the product exists -->
<section class="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
	<div class="grid gap-10 lg:grid-cols-2 lg:gap-16">
		<div>
			<h2 class="heading-display text-4xl leading-none sm:text-5xl">
				Send the new guy. Keep the price sheet.
			</h2>
			<p class="text-ink-700 mt-5 max-w-xl text-lg leading-relaxed">
				Your pricing took years to dial in. Hand it to a $15-an-hour estimator and you've trained
				your next competitor. With EzEval they collect the measurements and you decide who sees the
				money.
			</p>
		</div>
		<dl>
			{#each visibilityModes as mode (mode.name)}
				<div class="border-ink-200 border-t-2 py-5 first:border-t-0 first:pt-0 lg:first:pt-1">
					<dt class="font-display text-2xl font-semibold tracking-wide">{mode.name}</dt>
					<dd class="text-ink-700 mt-1.5 max-w-xl leading-relaxed">{mode.body}</dd>
				</div>
			{/each}
		</dl>
	</div>
</section>

<!-- HOW A QUOTE HAPPENS: a real sequence, so it is numbered -->
<section class="border-ink-200 border-y-2 bg-white">
	<div class="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
		<h2 class="heading-display text-4xl leading-none">From driveway to saved quote</h2>
		<ol class="mt-10 grid gap-8 md:grid-cols-3 md:gap-10">
			{#each steps as step, index (step.title)}
				<li>
					<p class="num text-brand-600 text-3xl">{index + 1}</p>
					<h3 class="font-display mt-2 text-2xl font-semibold tracking-wide">{step.title}</h3>
					<p class="text-ink-700 mt-2 leading-relaxed">{step.body}</p>
				</li>
			{/each}
		</ol>
		<p class="mt-10">
			<a
				href="/window-cleaning-price-calculator"
				class="text-ink-900 font-semibold underline decoration-2 underline-offset-4"
			>
				Try your own prices in the free calculator
			</a>
		</p>
	</div>
</section>

<!-- THE REST OF THE DAY -->
<section class="bg-ink-900 py-16 lg:py-24">
	<div class="mx-auto max-w-6xl px-4 sm:px-6">
		<h2 class="heading-display text-paper text-4xl leading-none">Everything the truck needs</h2>
		<div class="mt-10 grid gap-10 md:grid-cols-3">
			<div>
				<h3 class="font-display text-paper text-2xl font-semibold tracking-wide">
					Runs that loop, not zig-zag
				</h3>
				<p class="text-ink-200 mt-2 leading-relaxed">
					Assign a day of estimates and EzEval orders the stops into one ring around town.
					Fixed-time appointments stay fixed. Everyone else slots in around them.
				</p>
			</div>
			<div>
				<h3 class="font-display text-paper text-2xl font-semibold tracking-wide">
					Your process, on every job
				</h3>
				<p class="text-ink-200 mt-2 leading-relaxed">
					"Call the customer 25 minutes out." Write the checklist once and every job carries it. You
					can see it was followed without asking.
				</p>
			</div>
			<div>
				<h3 class="font-display text-paper text-2xl font-semibold tracking-wide">
					No surprise rottweilers
				</h3>
				<p class="text-ink-200 mt-2 leading-relaxed">
					Animals on the property are a field on every customer. Your crew sees the warning before
					they open the gate.
				</p>
				<p class="chip-hazard mt-4">
					<Icon name="paw" size={16} />
					Two dogs in the back yard. Call first.
				</p>
			</div>
		</div>
	</div>
</section>

<!-- WHERE IT CAME FROM -->
<section class="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
	<div class="grid gap-10 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-16">
		<div class="max-w-2xl">
			<h2 class="heading-display text-4xl leading-none sm:text-5xl">
				It started as one window cleaner's price sheet
			</h2>
			<div class="text-ink-700 mt-6 space-y-4 text-lg leading-relaxed">
				<p>
					The first EzEval was a single page I built in 2021 for my own window cleaning quotes. One
					fixed price sheet. I'd tap my way around a house, copy the total onto a piece of paper,
					and write up the quote at home.
				</p>
				<p>
					The tapping was the good part. The rest got rebuilt for crews: your own sheets and prices,
					customers and routes, and a way to send someone else out to count a job without handing
					over the numbers you spent years working out.
				</p>
				<p>
					The sheet your account starts with is that original one: special items, then high, mid,
					and ground level, priced by how hard the glass is to reach.
				</p>
			</div>
		</div>
		<figure class="mx-auto w-full max-w-72">
			<img
				src={originalTool}
				alt="The 2021 quote tool: four rows of plain grey buttons, a pane count of 38, a grand total of $177.00, and an itemized table."
				width="500"
				height="1150"
				loading="lazy"
				class="border-ink-200 h-96 w-full rounded-xl border-2 object-cover object-top"
			/>
			<figcaption class="text-ink-600 mt-2 text-sm">
				The original, 2021. Same four rows, a lot less paint.
			</figcaption>
		</figure>
	</div>
</section>

<!-- PRICING -->
<section id="pricing" class="border-ink-200 scroll-mt-20 border-y-2 bg-white">
	<div class="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:py-20">
		<div>
			<h2 class="heading-display text-4xl leading-none sm:text-5xl">One price for the business</h2>
			<p class="mt-6 flex items-baseline gap-3">
				<span class="num text-7xl font-bold">$5</span>
				<span class="text-ink-700 text-lg">a month, per business</span>
			</p>
			<p class="text-ink-700 mt-4 max-w-md leading-relaxed">
				Free for the first {TRIAL_DAYS} days, with no card needed to start. Subscribe when the trial ends
				if it earns its place in the truck.
			</p>
		</div>
		<div class="lg:pt-2">
			<ul class="space-y-3 text-lg">
				{#each ['Unlimited price sheets and evaluations', 'Price visibility settings for every sheet', 'Route ordering for each day of estimates', 'Workflow checklists for your crew'] as line (line)}
					<li class="flex items-start gap-3">
						<Icon name="check" size={22} class="text-glass-600 mt-1 shrink-0" />
						{line}
					</li>
				{/each}
			</ul>
			<a href="/signup" class="btn-primary btn-lg mt-8 w-full sm:w-auto">
				Start your {TRIAL_DAYS}-day trial
			</a>
		</div>
	</div>
</section>

<!-- QUESTIONS -->
<section class="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:py-24">
	<h2 class="heading-display text-4xl leading-none">Questions owners ask</h2>
	<div class="border-ink-200 mt-8 border-b-2">
		{#each faqs as faq (faq.q)}
			<details class="border-ink-200 group border-t-2">
				<summary
					class="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-lg font-semibold [&::-webkit-details-marker]:hidden"
				>
					{faq.q}
					<Icon
						name="plus"
						size={20}
						class="text-ink-500 shrink-0 transition-transform group-open:rotate-45"
					/>
				</summary>
				<p class="text-ink-700 max-w-2xl pb-5 leading-relaxed">{faq.a}</p>
			</details>
		{/each}
	</div>
	<p class="text-ink-700 mt-6">
		Something else? Email <ObfuscatedEmail /> and a person answers.
	</p>
</section>
