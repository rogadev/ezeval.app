/** Canonical public origin. The apex domain redirects here. */
export const SITE_URL = 'https://www.ezeval.app';

export const SITE_NAME = 'EzEval';

/** Days a new business can use the app before subscribing. */
export const TRIAL_DAYS = 14;

/** Public, indexable pages, in sitemap order. */
export const PUBLIC_PAGES = [
	{ path: '/', priority: 1.0 },
	{ path: '/window-cleaning-price-calculator', priority: 0.9 },
	{ path: '/how-to-price-window-cleaning', priority: 0.8 },
	{ path: '/terms', priority: 0.2 },
	{ path: '/privacy', priority: 0.2 }
] as const;

export function absoluteUrl(path: string): string {
	return `${SITE_URL}${path === '/' ? '/' : path}`;
}
