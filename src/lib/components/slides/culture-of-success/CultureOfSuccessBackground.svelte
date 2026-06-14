<script>
	import CultureSuccessTriangle from '$lib/components/charts/CultureSuccessTriangle.svelte';
	import { getSlideIndex } from '$lib/data/copy.js';
	import { easeInOutCubic } from '$lib/utils/ease.js';

	
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
		box-sizing: border-box;
	}
</style>
