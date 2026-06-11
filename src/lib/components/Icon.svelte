<script lang="ts" module>
	// Minimal stroke icon set (24x24, stroke-based, currentColor).
	const PATHS: Record<string, string> = {
		today: 'M8 2v4M16 2v4M3.5 9h17M5 4.5h14a1.5 1.5 0 0 1 1.5 1.5v13a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 19V6A1.5 1.5 0 0 1 5 4.5Z',
		grid: 'M4 4h6.5v6.5H4V4Zm9.5 0H20v6.5h-6.5V4ZM4 13.5h6.5V20H4v-6.5Zm9.5 0H20V20h-6.5v-6.5Z',
		users:
			'M16 19v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 17.5V19M10 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM20 19v-1.5a3.5 3.5 0 0 0-2.5-3.35M14.5 4.15a3.5 3.5 0 0 1 0 6.7',
		map: 'M9 4 3.5 6v14L9 18l6 2 5.5-2V4L15 6 9 4Zm0 0v14m6-12v14',
		quote:
			'M8 3.5h8A1.5 1.5 0 0 1 17.5 5v16l-3.25-2-2.25 2-2.25-2L6.5 21V5A1.5 1.5 0 0 1 8 3.5ZM9.5 8h5m-5 4h5m-5 4h3',
		more: 'M5 12h.01M12 12h.01M19 12h.01M5 13a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm7 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm7 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z',
		plus: 'M12 5v14M5 12h14',
		trash: 'M4 7h16M10 11v6m4-6v6M6 7l1 13a1.5 1.5 0 0 0 1.5 1.3h7A1.5 1.5 0 0 0 17 20l1-13M9 7V4.5A1.5 1.5 0 0 1 10.5 3h3A1.5 1.5 0 0 1 15 4.5V7',
		back: 'M15 5l-7 7 7 7',
		settings:
			'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7.4-3a7.4 7.4 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7.4 7.4 0 0 0-2-1.2L14.5 3h-5l-.4 2.6a7.4 7.4 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.6a7.5 7.5 0 0 0 0 2.4l-2 1.6 2 3.4 2.4-1a7.4 7.4 0 0 0 2 1.2l.4 2.6h5l.4-2.6a7.4 7.4 0 0 0 2-1.2l2.4 1 2-3.4-2-1.6c.07-.4.1-.8.1-1.2Z',
		logout: 'M9 20H5.5A1.5 1.5 0 0 1 4 18.5v-13A1.5 1.5 0 0 1 5.5 4H9m6 12 5-4-5-4m5 4H9',
		workflow:
			'M5 5.5h4v4H5v-4Zm10 9h4v4h-4v-4Zm-8-5v3A2.5 2.5 0 0 0 9.5 15H15M9 7.5h8.5',
		billing:
			'M3.5 8.5h17m-15-3h13A1.5 1.5 0 0 1 20 7v10a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17V7a1.5 1.5 0 0 1 1.5-1.5ZM7 14.5h4',
		paw: 'M12 16.5c-2.5 0-4.5 1.4-4.5 3 0 1 .8 1.5 2 1.5 1 0 1.6-.4 2.5-.4s1.5.4 2.5.4c1.2 0 2-.5 2-1.5 0-1.6-2-3-4.5-3ZM7.5 13a1.8 2.2 0 1 0 0-4.4 1.8 2.2 0 0 0 0 4.4Zm9 0a1.8 2.2 0 1 0 0-4.4 1.8 2.2 0 0 0 0 4.4ZM10 8a1.8 2.2 0 1 0 0-4.4A1.8 2.2 0 0 0 10 8Zm4.5 0a1.8 2.2 0 1 0 0-4.4 1.8 2.2 0 0 0 0 4.4Z',
		phone:
			'M5 4.5h3L9.5 9l-2 1.5a12 12 0 0 0 6 6L15 14.5l4.5 1.5v3A1.5 1.5 0 0 1 18 20.5 15.5 15.5 0 0 1 3.5 6 1.5 1.5 0 0 1 5 4.5Z',
		check: 'M5 13l4 4L19 7',
		pin: 'M12 21s-7-5.3-7-11a7 7 0 0 1 14 0c0 5.7-7 11-7 11Zm0-8.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z',
		clock: 'M12 7v5l3.5 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
		edit: 'M16.5 4.5l3 3L8 19l-4 1 1-4L16.5 4.5Z',
		x: 'M6 6l12 12M18 6 6 18',
		minus: 'M5 12h14',
		route: 'M6 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm12-10a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM8 17h7a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h7'
	};

	export type IconName = keyof typeof PATHS;
</script>

<script lang="ts">
	let {
		name,
		size = 24,
		class: className = ''
	}: { name: string; size?: number; class?: string } = $props();
</script>

<svg
	width={size}
	height={size}
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width="1.8"
	stroke-linecap="round"
	stroke-linejoin="round"
	class={className}
	aria-hidden="true"
>
	<path d={PATHS[name] ?? ''} />
</svg>
