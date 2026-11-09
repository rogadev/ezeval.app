<script lang="ts">
	import Seo from '$lib/components/Seo.svelte';
	import { formatCents } from '$lib/pricing/engine';
	import { SAMPLE_SHEET } from '$lib/pricing/sample-sheet';
	import { SITE_URL, TRIAL_DAYS, absoluteUrl } from '$lib/site';

	const title = 'How to price window cleaning: build a price sheet';
	const description =
		'A working method for pricing window cleaning jobs: price by window size and access level, add a setup fee and a minimum, and keep the sheet private from your crew.';

	const jsonLd = {
		'@context': 'https://schema.org',
		'@type': 'Article',
		headline: title,
		description,
		mainEntityOfPage: absoluteUrl('/how-to-price-window-cleaning'),
		author: { '@type': 'Organization', name: 'Roga Digital', url: `${SITE_URL}/` },
		publisher: { '@type': 'Organization', name: 'Roga Digital' }
	};
</script>

<Seo title="{title} | EzEval" {description} path="/how-to-price-window-cleaning" {jsonLd} />

<article class="guide mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:py-16">
	<h1 class="heading-display text-5xl leading-[0.95] sm:text-6xl">How to price window cleaning</h1>
	<p class="lead">
		Most pricing trouble on a window cleaning job comes from working the number out fresh every
		time. A price sheet fixes that. You decide what each kind of window costs once, and every quote
		after that is counting. This is the method EzEval is built around.
	</p>

	<h2>Price the window, not the hour</h2>
	<p>
		An hourly guess punishes you for getting faster and makes two estimators quote the same house
		differently. A price per window does neither. The customer gets a number that doesn't depend on
		who showed up, and you get paid for the job, not the time.
	</p>
	<p>
		To get there you need a short list of window types and a price for each. Two things separate one
		window from another: how big it is and how hard it is to reach.
	</p>

	<h2>Sort by access level first</h2>
	<p>
		Reach changes the labor more than size does, so make access level the rows of your sheet. Three
		levels cover most houses:
	</p>
	<ul>
		<li>
			<strong>Ground level.</strong> Glass you walk up to and clean. Your cheapest row.
		</li>
		<li>
			<strong>Mid level.</strong> Second-storey glass you reach from the ground, usually with a water-fed
			pole. More setup and slower work.
		</li>
		<li>
			<strong>High level.</strong> Anything that needs the roof, an anchor, and a rope. The slowest and
			riskiest glass on the property, so it carries your highest prices.
		</li>
	</ul>

	<h2>Then size: small, medium, large</h2>
	<p>
		Inside each level, three sizes is enough. More than that and estimators start arguing with
		themselves on the lawn. Agree on what each size means for your crew, such as "a large is
		anything you can't cover in one pass," and stick to it.
	</p>
	<p>
		That gives you a grid of nine buttons. Here is the example sheet every new EzEval account starts
		with. Treat the numbers as a worked example, not a market rate: your region, your costs, and
		your speed set your prices.
	</p>

	<div class="overflow-x-auto">
		<table>
			<caption>Example price sheet, per window</caption>
			<thead>
				<tr>
					<th scope="col">Access level</th>
					<th scope="col">Small</th>
					<th scope="col">Medium</th>
					<th scope="col">Large</th>
				</tr>
			</thead>
			<tbody>
				{#each SAMPLE_SHEET.rows.slice(1) as row (row.label)}
					<tr>
						<th scope="row">{row.label}</th>
						{#each row.buttons as button (button.id)}
							<td class="num">{formatCents(button.priceCents)}</td>
						{/each}
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	<h2>Give the odd ones their own buttons</h2>
	<p>
		Some glass doesn't fit the grid. Price it separately so it doesn't drag your averages around.
	</p>
	<ul>
		<li>
			<strong>French panes.</strong> One door can hold fifteen small panes, each with four edges to
			detail. Charge per pane. The example sheet uses {formatCents(100)} a pane.
		</li>
		<li>
			<strong>Skylights.</strong> Awkward access and awkward angles. A flat price each works better than
			trying to size them.
		</li>
	</ul>

	<h2>Add a setup fee to every job</h2>
	<p>
		Before you clean a single window you've paid for advertising, driven out to estimate, and loaded
		the truck. A setup fee is a fixed amount added to every job to cover that overhead. It keeps
		small jobs from losing money and means your per-window prices only have to cover the cleaning.
	</p>
	<p>
		Make it automatic. A fee someone has to remember to add is a fee that gets forgotten on a busy
		day.
	</p>

	<h2>Set a minimum quote</h2>
	<p>
		A minimum is the lowest total you will send, whatever the count says. If the windows and setup
		fee add up to less, the minimum is the price. It protects you from jobs that aren't worth the
		drive.
	</p>
	<p>
		It also protects your sheet. If a helper can see a total, a minimum stops them tapping one
		window to learn what you charge for it.
	</p>

	<h2>Keep separate sheets for different work</h2>
	<p>
		Residential, commercial, and post-construction cleaning don't price alike. Storefront glass is
		fast and repetitive. Post-construction glass has paint, stickers, and silicone on it. One sheet
		stretched over all three will be wrong for at least two. Build a sheet for each kind of work you
		take on.
	</p>

	<h2>Decide who gets to see it</h2>
	<p>
		A price sheet you've tuned over years is worth protecting. The moment you send someone else to
		do estimates, you have three choices: hand them the sheet, have them bring back counts for you
		to price, or let them quote a total without seeing how it was built.
	</p>
	<p>
		The second and third are why EzEval exists. An estimator taps the windows on their phone and,
		depending on how you set the sheet, sees either nothing in dollars or only the grand total.
	</p>

	<div class="cta">
		<p class="cta-title">Try the method with your own numbers</p>
		<p>
			The free calculator uses this exact layout. Change the prices, tap out a house, and see the
			itemized total.
		</p>
		<div class="mt-5 flex flex-wrap items-center gap-3">
			<a href="/window-cleaning-price-calculator" class="btn-primary">Open the price calculator</a>
			<a href="/signup" class="btn-outline">Start a {TRIAL_DAYS}-day trial</a>
		</div>
	</div>
</article>

<style>
	.guide :global(h2) {
		font-family: var(--font-display);
		font-size: 1.875rem;
		font-weight: 600;
		letter-spacing: 0.01em;
		line-height: 1.1;
		margin-top: 2.75rem;
	}
	.guide :global(p),
	.guide :global(li) {
		font-size: 1.125rem;
		line-height: 1.7;
		color: var(--color-ink-700);
	}
	.guide :global(p) {
		margin-top: 1rem;
	}
	.guide .lead {
		margin-top: 1.5rem;
		font-size: 1.25rem;
		color: var(--color-ink-800);
	}
	.guide :global(ul) {
		margin-top: 1rem;
		padding-left: 1.25rem;
		list-style: disc;
	}
	.guide :global(li) {
		margin-top: 0.5rem;
	}
	.guide :global(strong) {
		color: var(--color-ink-900);
	}
	.guide table {
		margin-top: 1.5rem;
		width: 100%;
		border-collapse: collapse;
		background: white;
		font-size: 1.0625rem;
	}
	.guide caption {
		caption-side: bottom;
		padding-top: 0.5rem;
		text-align: left;
		font-size: 0.875rem;
		color: var(--color-ink-600);
	}
	.guide th,
	.guide td {
		border: 2px solid var(--color-ink-200);
		padding: 0.625rem 0.875rem;
		text-align: left;
	}
	.guide thead th {
		background: var(--color-ink-900);
		color: var(--color-paper);
		border-color: var(--color-ink-900);
	}
	.guide td {
		font-weight: 500;
	}
	.guide .cta {
		margin-top: 3rem;
		border-top: 2px solid var(--color-ink-200);
		padding-top: 2rem;
	}
	.guide .cta-title {
		margin-top: 0;
		font-family: var(--font-display);
		font-size: 1.875rem;
		font-weight: 600;
		line-height: 1.1;
		color: var(--color-ink-900);
	}
</style>
