<script lang="ts">
	// Anti-scraper: the address never appears as plain text anywhere — the SVG
	// uses numeric character references, and the mailto: is assembled on click.
	const codes = [114, 121, 97, 110, 64, 114, 111, 103, 97, 46, 100, 101, 118];
	const entities = codes.map((c) => `&#${c};`).join('');
	const svg =
		'<svg xmlns="http://www.w3.org/2000/svg" width="104" height="18">' +
		'<text x="0" y="14" font-family="Barlow, ui-sans-serif, sans-serif" font-size="15" ' +
		`font-weight="600" fill="#405064" textLength="104" lengthAdjust="spacingAndGlyphs">${entities}</text>` +
		'</svg>';
	const src = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

	function open() {
		location.href = `mailto:${String.fromCharCode(...codes)}`;
	}
</script>

<button type="button" onclick={open} aria-label="Send us an email" class="email-btn">
	<img {src} alt="" width="104" height="18" loading="lazy" />
</button>

<style>
	.email-btn {
		display: inline-block;
		padding: 0;
		background: none;
		border: none;
		border-bottom: 2px solid currentColor;
		vertical-align: -4px;
		line-height: 0;
		cursor: pointer;
	}
</style>
