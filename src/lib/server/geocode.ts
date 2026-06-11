/**
 * Best-effort forward geocoding via OSM Nominatim (free, ~1 req/s fair use).
 * Customer save volume is far below the rate limit; failures return null and
 * the customer simply shows as "unmapped" until the address is edited again.
 */
export interface GeoPoint {
	lat: number;
	lng: number;
}

export async function geocodeAddress(parts: {
	addressLine1?: string | null;
	city?: string | null;
	region?: string | null;
	postalCode?: string | null;
}): Promise<GeoPoint | null> {
	const query = [parts.addressLine1, parts.city, parts.region, parts.postalCode]
		.map((p) => p?.trim())
		.filter(Boolean)
		.join(', ');
	if (!query) return null;

	try {
		const url = new URL('https://nominatim.openstreetmap.org/search');
		url.searchParams.set('q', query);
		url.searchParams.set('format', 'jsonv2');
		url.searchParams.set('limit', '1');
		const response = await fetch(url, {
			headers: { 'User-Agent': 'EzEval/1.0 (https://ezeval.app)' },
			signal: AbortSignal.timeout(5000)
		});
		if (!response.ok) return null;
		const results = (await response.json()) as { lat: string; lon: string }[];
		if (!results.length) return null;
		const lat = Number(results[0].lat);
		const lng = Number(results[0].lon);
		if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
		return { lat, lng };
	} catch {
		return null;
	}
}
