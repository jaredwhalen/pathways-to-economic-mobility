<script>
	import {
		buildRegionDiagramLayout,
		getRotatedNodes,
		REGION_DIAGRAM_WIDTH,
		REGION_NODES,
		REGION_RING_COLOR
	} from '$lib/utils/regionDiagramLayout.js';

	/** @type {{ nodes?: import('$lib/utils/regionDiagramLayout.js').RegionNodeDef[] }} */
	let { nodes = REGION_NODES } = $props();

	const ROTATION_MS_PER_REV = 48000;

	let layout = $derived(buildRegionDiagramLayout(REGION_DIAGRAM_WIDTH, nodes));
	let rotation = $state(0);
	let displayNodes = $derived(getRotatedNodes(layout, rotation));

	let ariaLabel = $derived(
		`Regional relationships among ${nodes.map((node) => node.label).join(', ')}. A circle connects each to the others.`
	);

	$effect(() => {
		if (typeof window === 'undefined') return;

		const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		if (reducedMotion) return;

		let rafId = 0;
		let last = performance.now();

		const tick = (now) => {
			const dt = now - last;
			last = now;
			rotation += ((Math.PI * 2) / ROTATION_MS_PER_REV) * dt;
			rafId = requestAnimationFrame(tick);
		};

		rafId = requestAnimationFrame(tick);

		return () => cancelAnimationFrame(rafId);
	});
</script>

<figure class="region-diagram" aria-label={ariaLabel}>
	<svg
		viewBox="0 0 {layout.width} {layout.height}"
		preserveAspectRatio="xMidYMid meet"
		shape-rendering="geometricPrecision"
	>
		<defs>
			{#each displayNodes as node (node.id)}
				<clipPath id="region-node-clip-{node.id}">
					<circle cx={node.x} cy={node.y} r={node.imageR} />
				</clipPath>
			{/each}
		</defs>

		<circle
			class="connect-ring"
			cx={layout.ring.cx}
			cy={layout.ring.cy}
			r={layout.ring.r}
			fill="none"
			stroke={REGION_RING_COLOR}
			stroke-width={layout.ring.stroke}
			aria-hidden="true"
		/>

		<g class="stroke-masks" aria-hidden="true">
			{#each displayNodes as node (node.id)}
				<circle
					class="stroke-mask"
					cx={node.x}
					cy={node.y}
					r={layout.type.strokeMaskR}
				/>
			{/each}
		</g>

		<g class="nodes" aria-hidden="true">
			{#each displayNodes as node (node.id)}
				<g class="node-group">
					<circle
						class="node-ring"
						cx={node.x}
						cy={node.y}
						r={node.r}
						fill="var(--color-white)"
						stroke={node.color}
						stroke-width={node.ringWidth}
					/>
					{#if node.image}
						<image
							class="node-image"
							href={node.image}
							x={node.x - node.imageR}
							y={node.y - node.imageR}
							width={node.imageR * 2}
							height={node.imageR * 2}
							clip-path="url(#region-node-clip-{node.id})"
							preserveAspectRatio="xMidYMid slice"
						/>
					{:else}
						<circle
							class="node-fill"
							cx={node.x}
							cy={node.y}
							r={node.imageR}
							fill={node.color}
						/>
					{/if}
				</g>
				<text
					class="node-label"
					x={node.labelX}
					y={node.labelY}
					text-anchor="middle"
					font-size={layout.type.label}
				>
					{node.label}
				</text>
			{/each}
		</g>
	</svg>
</figure>

<style>
	.region-diagram {
		margin: 0;
		width: min(92vw, 52rem);
		height: min(82vh, 52rem);
		max-width: none;
	}

	.region-diagram svg {
		display: block;
		width: 100%;
		height: 100%;
		overflow: visible;
	}

	.region-diagram :global(.connect-ring) {
		stroke-linecap: round;
	}

	.region-diagram :global(.stroke-mask) {
		fill: var(--color-off-white);
		stroke: none;
	}

	.region-diagram :global(.node-group) {
		filter: drop-shadow(0 4px 14px rgba(3, 31, 67, 0.14));
	}

	.region-diagram :global(.node-label) {
		font-family: var(--font-body);
		font-weight: var(--font-weight-regular);
		fill: var(--color-navy);
		stroke: var(--color-off-white);
		stroke-width: 5px;
		paint-order: stroke fill;
		stroke-linejoin: round;
		dominant-baseline: hanging;
	}
</style>
