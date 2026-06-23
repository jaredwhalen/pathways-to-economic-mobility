<script>
	import ReciprocalRegionDiagram from '$lib/components/charts/ReciprocalRegionDiagram.svelte';
	import { REGION_NODES } from '$lib/utils/regionDiagramLayout.js';
	import { assetUrl } from '$lib/utils/assetUrl.js';

	const nodes = REGION_NODES.map((node) => ({
		...node,
		image:
			node.id === 'campus'
				? assetUrl('/images/problem-campus.webp')
				: node.id === 'community'
					? assetUrl('/images/community-2.webp')
					: node.id === 'economy'
						? assetUrl('/images/economy.webp')
					: assetUrl('/images/public-agenda-engagement.webp')
	}));
</script>

<div class="regional-reciprocity-visual" role="presentation">
	<ReciprocalRegionDiagram {nodes} />
</div>

<style>
	.regional-reciprocity-visual {
		width: 100%;
		height: 100dvh;
		min-height: 100dvh;
		box-sizing: border-box;
		background-color: var(--color-off-white);
	}
</style>
