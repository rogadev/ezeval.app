<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import Icon from '$lib/components/Icon.svelte';
	import type { ActionData, PageData } from './$types';
	import type { Map as LeafletMap } from 'leaflet';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const mapped = $derived(data.stops.filter((s) => s.lat !== null && s.lng !== null));
	const unmapped = $derived(data.stops.filter((s) => s.lat === null || s.lng === null));

	let mapEl: HTMLDivElement | undefined = $state();
	let map: LeafletMap | null = null;
	let optimizing = $state(false);

	$effect(() => {
		// re-render markers whenever the day's stops change
		const stops = mapped;
		if (!mapEl) return;

		let cancelled = false;
		(async () => {
			const L = (await import('leaflet')).default;
			await import('leaflet/dist/leaflet.css');
			if (cancelled || !mapEl) return;

			map?.remove();
			map = L.map(mapEl, { scrollWheelZoom: true });
			L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
				maxZoom: 19,
				attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
			}).addTo(map);

			if (stops.length === 0) {
				map.setView([49.68, -124.99], 11); // somewhere nice until there's data
				return;
			}

			const points: [number, number][] = [];
			for (const [index, stop] of stops.entries()) {
				const point: [number, number] = [stop.lat!, stop.lng!];
				points.push(point);
				const icon = L.divIcon({
					className: '',
					html: `<div class="route-marker${stop.fixedTime ? ' route-marker--fixed' : ''}">${index + 1}</div>`,
					iconSize: [32, 32],
					iconAnchor: [16, 16]
				});
				L.marker(point, { icon })
					.addTo(map)
					.bindPopup(
						`<strong>${index + 1}. ${stop.customerName}</strong><br>` +
							`${[stop.addressLine1, stop.city].filter(Boolean).join(', ')}` +
							(stop.fixedTime ? `<br>Fixed @ ${stop.fixedTime}` : '<br>Flexible') +
							(stop.animalNotes ? `<br>⚠️ ${stop.animalNotes}` : '') +
							`<br><a href="/app/tasks/${stop.id}">Open job</a>`
					);
			}
			if (points.length > 1) {
				L.polyline(points, { color: '#f59006', weight: 4, opacity: 0.8, dashArray: '8 6' }).addTo(
					map
				);
			}
			map.fitBounds(L.latLngBounds(points), { padding: [40, 40], maxZoom: 15 });
		})();

		return () => {
			cancelled = true;
		};
	});
</script>

<svelte:head>
	<title>Route map — EzEval</title>
</svelte:head>

<div class="mb-4 flex flex-wrap items-center justify-between gap-3">
	<h1 class="heading-display text-3xl">Route</h1>
	<div class="flex items-center gap-2">
		<input
			type="date"
			value={data.date}
			onchange={(e) => goto(`/app/map?date=${e.currentTarget.value}`)}
			class="field w-auto py-2"
			aria-label="Route date"
		/>
		<form
			method="POST"
			action="?/optimize"
			use:enhance={() => {
				optimizing = true;
				return async ({ update }) => {
					optimizing = false;
					await update();
				};
			}}
		>
			<input type="hidden" name="date" value={data.date} />
			<button type="submit" disabled={optimizing || mapped.length < 2} class="btn-primary">
				<Icon name="route" size={20} />
				{optimizing ? 'Optimizing…' : 'Optimize route'}
			</button>
		</form>
	</div>
</div>

{#if form?.optimized}
	<p class="bg-glass-100 text-glass-800 mb-4 rounded-xl px-4 py-3 text-sm font-semibold">
		Route optimized — {form.optimized} stops ordered into the smoothest loop.
	</p>
{/if}

{#if data.stops.length === 0}
	<div class="card text-ink-500 p-8 text-center">
		No active jobs on {data.date}.
		<a href="/app/tasks" class="font-semibold underline">Schedule some</a> and they'll appear here.
	</div>
{:else}
	<div class="card overflow-hidden">
		<div bind:this={mapEl} class="h-[55vh] w-full lg:h-[60vh]"></div>
	</div>

	<ol class="card divide-ink-100 mt-4 divide-y-2">
		{#each mapped as stop, index (stop.id)}
			<li>
				<a href="/app/tasks/{stop.id}" class="hover:bg-ink-50 flex items-center gap-3 px-4 py-2.5">
					<span
						class="num flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm
							{stop.fixedTime ? 'bg-brand-500 text-ink-950' : 'bg-ink-900 text-paper'}"
					>
						{index + 1}
					</span>
					<div class="min-w-0 flex-1">
						<p class="truncate font-semibold">{stop.customerName}</p>
						<p class="text-ink-400 truncate text-sm">
							{#if stop.fixedTime}<span class="num">@ {stop.fixedTime}</span> fixed ·{/if}
							{[stop.addressLine1, stop.city].filter(Boolean).join(', ')}
						</p>
					</div>
					{#if stop.animalNotes}
						<Icon name="paw" size={16} class="text-brand-600 shrink-0" />
					{/if}
				</a>
			</li>
		{/each}
	</ol>

	{#if unmapped.length}
		<div class="card mt-4 p-4">
			<p class="field-label">Not on the map (no geocoded address)</p>
			<ul class="space-y-1">
				{#each unmapped as stop (stop.id)}
					<li>
						<a href="/app/tasks/{stop.id}" class="text-ink-600 text-sm underline">
							{stop.customerName}
						</a>
					</li>
				{/each}
			</ul>
		</div>
	{/if}
{/if}

<style>
	:global(.route-marker) {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		border-radius: 9999px;
		background: var(--color-ink-900);
		color: var(--color-paper);
		font-family: var(--font-mono);
		font-weight: 600;
		font-size: 14px;
		border: 2.5px solid white;
		box-shadow: 0 2px 6px rgb(0 0 0 / 0.35);
	}
	:global(.route-marker--fixed) {
		background: var(--color-brand-500);
		color: var(--color-ink-950);
	}
</style>
