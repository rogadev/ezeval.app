import { describe, it, expect } from 'vitest';
import { haversineKm, optimizeRoute, type Stop } from './optimize';

// A simple west-to-east line of towns along ~49.7N (Vancouver Island-ish).
const stop = (id: string, lat: number, lng: number, fixedTime: string | null = null): Stop => ({
	id,
	lat,
	lng,
	fixedTime
});

function routeLengthKm(stops: Stop[], order: string[]): number {
	const byId = new Map(stops.map((s) => [s.id, s]));
	let total = 0;
	for (let i = 1; i < order.length; i++) {
		const a = byId.get(order[i - 1])!;
		const b = byId.get(order[i])!;
		total += haversineKm(a, b);
	}
	return total;
}

describe('haversineKm', () => {
	it('returns 0 for identical points', () => {
		expect(haversineKm({ lat: 49.7, lng: -125 }, { lat: 49.7, lng: -125 })).toBe(0);
	});

	it('matches a known distance (Courtenay to Campbell River ~28km)', () => {
		const courtenay = { lat: 49.6841, lng: -124.9904 };
		const campbellRiver = { lat: 50.0244, lng: -125.2475 };
		const km = haversineKm(courtenay, campbellRiver);
		expect(km).toBeGreaterThan(35);
		expect(km).toBeLessThan(45);
	});
});

describe('optimizeRoute', () => {
	it('returns empty for no stops', () => {
		expect(optimizeRoute([])).toEqual([]);
	});

	it('returns the single stop', () => {
		expect(optimizeRoute([stop('a', 49.7, -125)])).toEqual(['a']);
	});

	it('orders a scattered set into the obvious sweep (no criss-crossing)', () => {
		// Stops on a line west->east, given shuffled. Optimal: sweep the line.
		const stops = [
			stop('c', 49.7, -124.6),
			stop('a', 49.7, -125.0),
			stop('e', 49.7, -124.2),
			stop('b', 49.7, -124.8),
			stop('d', 49.7, -124.4)
		];
		const order = optimizeRoute(stops);
		// Either direction of the sweep is optimal.
		expect([order.join(''), [...order].reverse().join('')]).toContain('abcde');
	});

	it('beats the naive given order on a criss-cross layout', () => {
		// Alternating far-west/far-east points: naive order zig-zags badly.
		const stops = [
			stop('w1', 49.7, -125.0),
			stop('e1', 49.7, -124.0),
			stop('w2', 49.72, -125.01),
			stop('e2', 49.72, -124.01),
			stop('w3', 49.74, -125.02),
			stop('e3', 49.74, -124.02)
		];
		const order = optimizeRoute(stops);
		const naive = stops.map((s) => s.id);
		expect(routeLengthKm(stops, order)).toBeLessThan(routeLengthKm(stops, naive) * 0.6);
	});

	it('keeps fixed-time stops in chronological order', () => {
		const stops = [
			stop('flex1', 49.7, -124.5),
			stop('noon', 49.7, -124.0, '12:00'),
			stop('morning', 49.7, -125.0, '09:00'),
			stop('flex2', 49.7, -124.9)
		];
		const order = optimizeRoute(stops);
		expect(order.indexOf('morning')).toBeLessThan(order.indexOf('noon'));
	});

	it('slots flexible stops around fixed anchors by proximity', () => {
		// morning anchor far west, noon anchor far east; flex stops near each.
		const stops = [
			stop('nearNoon', 49.7, -124.05),
			stop('morning', 49.7, -125.0, '09:00'),
			stop('noon', 49.7, -124.0, '12:00'),
			stop('nearMorning', 49.7, -124.95)
		];
		const order = optimizeRoute(stops);
		expect(order.indexOf('morning')).toBeLessThan(order.indexOf('noon'));
		expect(order.indexOf('nearMorning')).toBeLessThan(order.indexOf('nearNoon'));
	});

	it('handles all-fixed stops by time alone', () => {
		const stops = [
			stop('b', 49.7, -124.5, '13:00'),
			stop('a', 49.7, -124.0, '08:00'),
			stop('c', 49.7, -125.0, '16:00')
		];
		expect(optimizeRoute(stops)).toEqual(['a', 'b', 'c']);
	});
});
