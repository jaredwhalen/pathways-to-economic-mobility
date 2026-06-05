<script>
	import { buildCultureTriangleLayout } from '$lib/utils/cultureTriangleLayout.js';

	let { fillProgress = 0 } = $props();

	let layout = $derived(buildCultureTriangleLayout(fillProgress));
</script>

<figure class="culture-triangle" aria-hidden="true">
	<svg
		viewBox="0 0 {layout.width} {layout.height}"
		preserveAspectRatio="xMidYMid meet"
		shape-rendering="geometricPrecision"
	>
		<defs>
			<linearGradient id="culture-top-fill" x1="0" y1="0" x2="0" y2="1">
				<stop offset="0%" stop-color="var(--color-purple)" stop-opacity="0.95" />
				<stop offset="100%" stop-color="var(--color-purple)" stop-opacity="0.55" />
			</linearGradient>
			<linearGradient id="culture-bottom-fill" x1="0" y1="1" x2="0" y2="0">
				<stop offset="0%" stop-color="var(--color-teal)" stop-opacity="0.95" />
				<stop offset="100%" stop-color="var(--color-teal)" stop-opacity="0.55" />
			</linearGradient>
		</defs>

		<polygon class="triangle-outline" points={layout.outline} />

		{#if layout.topFill}
			<polygon class="triangle-top" points={layout.topFill} fill="url(#culture-top-fill)" />
		{/if}

		{#if layout.bottomFill}
			<polygon class="triangle-bottom" points={layout.bottomFill} fill="url(#culture-bottom-fill)" />
		{/if}

		<text class="label label-top" x={layout.label.top.x} y={layout.label.top.y}>
			Leadership
		</text>
		<text class="label label-bottom" x={layout.label.bottom.x} y={layout.label.bottom.y}>
			Frontline staff
		</text>
	</svg>
</figure>

<style>
	.culture-triangle {
		margin: 0;
		width: 100%;
		max-width: 580px;
	}

	.culture-triangle svg {
		display: block;
		width: 100%;
		height: auto;
		overflow: visible;
	}

	.culture-triangle :global(.triangle-outline) {
		fill: var(--color-white);
		stroke: var(--color-teal-light);
		stroke-width: 2;
	}

	.culture-triangle :global(.label) {
		font-family: var(--font-body);
		font-size: clamp(15px, 2.6vw, 18px);
		letter-spacing: 0.08em;
		text-transform: uppercase;
		text-anchor: middle;
	}

	.culture-triangle :global(.label-top) {
		fill: var(--color-purple);
	}

	.culture-triangle :global(.label-bottom) {
		fill: var(--color-teal);
	}
</style>
