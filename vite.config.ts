import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';
import vercel from '@sveltejs/adapter-vercel';
import auto from '@sveltejs/adapter-auto';
import { sveltekit } from '@sveltejs/kit/vite';

// adapter-vercel's output step creates symlinks, which fail on Windows without
// Developer Mode. Vercel builds (VERCEL=1) get the real adapter; local builds
// fall back to adapter-auto, which compiles everything and skips packaging.
const adapter = process.env.VERCEL ? vercel() : auto();

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			adapter,
			typescript: {
				config: (config) => ({
					...config,
					include: [...config.include, '../drizzle.config.ts']
				})
			}
		})
	],
	test: {
		expect: { requireAssertions: true },
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	}
});
