<script>
	import Index from '$lib/components/Index.svelte';
	import { dev } from '$app/environment';
	import { env } from '$env/dynamic/public';
	import project from '$lib/config/project.js';

	const isStandalone = project.document.mode === 'standalone';
	const base = isStandalone && !dev ? (env?.PUBLIC_CDN_URL ?? '') : '';
</script>

<svelte:head>
	{#if base}
		<link rel="dns-prefetch" href={base} />
	{/if}
</svelte:head>

<div class="page-inner">
	<Index />
</div>

<style lang="scss">
	.page-inner {
		width: 100%;
	}
</style>
