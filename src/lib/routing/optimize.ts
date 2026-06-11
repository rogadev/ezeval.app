/**
 * Daily-run route ordering (spec §5.5): one efficient loop around town
 * instead of criss-crossing. Pure TSP heuristics over haversine distance —
 * no paid Directions API needed at daily-run sizes (n < ~50).
 *
 * Fixed-time appointments are hard anchors: they stay in chronological
 * order and flexible stops are slotted around them (spec §5.3).
 */

export interface Stop {
	id: string;
	lat: number;
	lng: number;
	fixedTime?: string | null;
}

interface Point {
	lat: number;
	lng: number;
}

const EARTH_RADIUS_KM = 6371;

export function haversineKm(a: Point, b: Point): number {
	const toRad = (deg: number) => (deg * Math.PI) / 180;
	const dLat = toRad(b.lat - a.lat);
	const dLng = toRad(b.lng - a.lng);
	const h =
		Math.sin(dLat / 2) ** 2 +
		Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
	return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

function routeLength(route: Stop[]): number {
	let total = 0;
	for (let i = 1; i < route.length; i++) total += haversineKm(route[i - 1], route[i]);
	return total;
}

/** Nearest-neighbor tour starting from a given stop. */
function nearestNeighbor(stops: Stop[], startIndex: number): Stop[] {
	const remaining = [...stops];
	const route = remaining.splice(startIndex, 1);
	while (remaining.length) {
		const current = route[route.length - 1];
		let best = 0;
		for (let i = 1; i < remaining.length; i++) {
			if (haversineKm(current, remaining[i]) < haversineKm(current, remaining[best])) best = i;
		}
		route.push(remaining.splice(best, 1)[0]);
	}
	return route;
}

/**
 * 2-opt improvement. A move reverses route[i..k]; when fixed anchors are
 * present a reversal is only legal if the segment contains at most one
 * anchor (reversing two would invert their chronological order).
 */
function twoOpt(route: Stop[]): Stop[] {
	let improved = true;
	let current = route;
	let guard = 0;
	while (improved && guard++ < 100) {
		improved = false;
		for (let i = 1; i < current.length - 1; i++) {
			for (let k = i + 1; k < current.length; k++) {
				const segment = current.slice(i, k + 1);
				if (segment.filter((s) => s.fixedTime).length > 1) continue;
				const candidate = [...current.slice(0, i), ...segment.reverse(), ...current.slice(k + 1)];
				if (routeLength(candidate) + 1e-9 < routeLength(current)) {
					current = candidate;
					improved = true;
				}
			}
		}
	}
	return current;
}

/** Cheapest-insertion of a stop into a route (between any adjacent pair, or at the ends). */
function insertCheapest(route: Stop[], stop: Stop): Stop[] {
	if (route.length === 0) return [stop];
	let bestIndex = 0;
	let bestCost = Infinity;
	for (let i = 0; i <= route.length; i++) {
		const prev = route[i - 1];
		const next = route[i];
		const cost =
			(prev ? haversineKm(prev, stop) : 0) +
			(next ? haversineKm(stop, next) : 0) -
			(prev && next ? haversineKm(prev, next) : 0);
		if (cost < bestCost) {
			bestCost = cost;
			bestIndex = i;
		}
	}
	return [...route.slice(0, bestIndex), stop, ...route.slice(bestIndex)];
}

export function optimizeRoute(stops: Stop[]): string[] {
	if (stops.length <= 1) return stops.map((s) => s.id);

	const fixed = stops
		.filter((s) => s.fixedTime)
		.sort((a, b) => (a.fixedTime! < b.fixedTime! ? -1 : 1));
	const flexible = stops.filter((s) => !s.fixedTime);

	let route: Stop[];
	if (fixed.length === 0) {
		// Pure TSP path: best nearest-neighbor start, then 2-opt.
		let best: Stop[] | null = null;
		for (let start = 0; start < stops.length; start++) {
			const candidate = twoOpt(nearestNeighbor(stops, start));
			if (!best || routeLength(candidate) < routeLength(best)) best = candidate;
		}
		route = best!;
	} else {
		// Anchors in time order; flexible stops slotted by cheapest insertion,
		// then anchor-respecting 2-opt.
		route = [...fixed];
		// Insert farthest-first for better placements.
		const queue = [...flexible].sort(
			(a, b) =>
				Math.min(...route.map((r) => haversineKm(r, b))) -
				Math.min(...route.map((r) => haversineKm(r, a)))
		);
		for (const stop of queue) route = insertCheapest(route, stop);
		route = twoOpt(route);
	}

	return route.map((s) => s.id);
}
