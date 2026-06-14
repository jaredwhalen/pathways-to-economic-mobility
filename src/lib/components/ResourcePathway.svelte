<script>
	import { buildPathThroughNodes, withTopAnchor } from '$lib/utils/pathwayLayout.js';

	
	let { nodes = [], revealed = false } = $props();

	let pathD = $derived(buildPathThroughNodes(withTopAnchor(nodes)));
</script>

<svg
	class="resource-pathway"
	class:revealed
	viewBox="0 0 100 100"
	preserveAspectRatio="none"
	aria-hidden="true"
>
	{#if pathD}
		<path class="resource-pathway-stroke" d={pathD} />
	{/if}
</svg>

<style>
	.resource-pathway {
		display: block;
		width: 100%;
		height: 100%;
		overflow: visible;
	}

	.resource-pathway-stroke {
		fill: none;
		stroke: var(--color-teal);
		stroke-opacity: 0;
		stroke-width: 4;
		stroke-linecap: round;
		stroke-linejoin: round;
		vector-effect: non-scaling-stroke;
		transition: stroke-opacity 900ms ease 200ms;
	}

	.resource-pathway.revealed .resource-pathway-stroke {
		stroke-opacity: 0.22;
	}

	@media (prefers-reduced-motion: reduce) {
		.resource-pathway-stroke {
			transition: none;
		}

		.resource-pathway.revealed .resource-pathway-stroke {
			stroke-opacity: 0.22;
		}
	}
</style>
