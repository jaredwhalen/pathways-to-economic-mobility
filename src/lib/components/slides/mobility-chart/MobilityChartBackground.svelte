<script>
	import MobilityLineChart from '$lib/components/charts/MobilityLineChart.svelte';

	/** @type {{ slideId?: string }} */
	let { slideId = 'college-cost' } = $props();
</script>

<MobilityLineChart {slideId} />
