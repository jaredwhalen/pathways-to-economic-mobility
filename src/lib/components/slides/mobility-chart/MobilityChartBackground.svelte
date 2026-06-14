<script>
	import MobilityLineChart from '$lib/components/charts/MobilityLineChart.svelte';

	
	let { slideId = 'college-cost' } = $props();
</script>

<MobilityLineChart {slideId} />
