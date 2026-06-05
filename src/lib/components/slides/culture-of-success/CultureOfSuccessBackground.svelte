<script>
	import CultureSuccessTriangle from '$lib/components/charts/CultureSuccessTriangle.svelte';
	import { getSlideIndex } from '$lib/data/copy.js';
	import { easeInOutCubic } from '$lib/utils/ease.js';

	/** @type {{ slideId?: string, slideOffset?: number }} */
	let { slideId = 'culture-of-success', slideOffset = 0 } = $props();

	const cultureIndex = getSlideIndex('culture-of-success');

	let fillProgress = $derived.by(() => {
		const index = getSlideIndex(slideId);
		if (index < cultureIndex) return 0;
		if (index > cultureIndex) return 1;
		return easeInOutCubic(Math.min(1, Math.max(0, slideOffset)));
	});
</script>

<div class="culture-of-success">
	<CultureSuccessTriangle {fillProgress} />
</div>

<style>
	.culture-of-success {
		width: 100%;
		height: 100dvh;
		min-height: 100dvh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding-inline: clamp(1.5rem, 4vw, 2.5rem);
		box-sizing: border-box;
	}
</style>
