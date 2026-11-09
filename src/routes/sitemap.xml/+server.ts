import { PUBLIC_PAGES, absoluteUrl } from '$lib/site';
import type { RequestHandler } from './$types';

export const prerender = true;

export const GET: RequestHandler = () => {
	const urls = PUBLIC_PAGES.map(
		(page) =>
			`\t<url><loc>${absoluteUrl(page.path)}</loc><priority>${page.priority.toFixed(1)}</priority></url>`
	).join('\n');

	const body =
		'<?xml version="1.0" encoding="UTF-8"?>\n' +
		'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
		`${urls}\n` +
		'</urlset>\n';

	return new Response(body, { headers: { 'Content-Type': 'application/xml' } });
};
