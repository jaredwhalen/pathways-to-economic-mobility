<script>
	import { browser } from '$app/environment';
	import USMapBackground from '$lib/components/charts/USMapBackground.svelte';
	import { hasMapboxToken } from '$lib/config/mapbox.js';

	
	let { slideId = 'regional-opportunity' } = $props();

	const useMapbox = hasMapboxToken();

	
	let MapboxMapBackground = $state(null);

	$effect(() => {
		if (!browser || !useMapbox) return;

		let cancelled = false;

		import('$lib/components/charts/MapboxMapBackground.svelte').then((module) => {
			if (!cancelled) MapboxMapBackground = module.default;
		});

		return () => {
			cancelled = true;
		};
	});
</script>

{#if useMapbox}
	{#if MapboxMapBackground}
		<MapboxMapBackground {slideId} />
	{/if}
{:else}
	<USMapBackground {slideId} />
{/if}
