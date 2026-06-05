<script>
	import USMapBackground from '$lib/components/charts/USMapBackground.svelte';

	/** @type {{ slideId?: string }} */
	let { slideId = 'regional-opportunity' } = $props();
</script>

<USMapBackground {slideId} />
