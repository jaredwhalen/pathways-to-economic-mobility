<script>
	import PublicOpinionChart from '$lib/components/PublicOpinionChart.svelte';
	import { formatSlideParagraph } from '$lib/utils/parseSlideText.js';

	/** @type {{ slide: import('$lib/data/copy.js').Slide, isActive: boolean }} */
	let { slide, isActive } = $props();

	let paragraphs = $derived(
		slide.text
			.split(/\n\s*\n/)
			.map((paragraph) => paragraph.trim())
			.filter((paragraph) => paragraph.length > 0)
			.map((paragraph) => formatSlideParagraph(paragraph))
	);
</script>

<section class="slide" class:active={isActive}>
	<div class="slide-content">
		{#each paragraphs as paragraph}
			<p class="slide-text">{@html paragraph}</p>
		{/each}
		{#if slide.showChart}
			<PublicOpinionChart active={isActive} />
		{/if}
	</div>
</section>

<style>
	.slide {
		height: 100dvh;
		display: flex;
		align-items: center;
		justify-content: center;
		margin: 0 0 1rem 0;
	}

	.slide:first-of-type {
		padding-top: 50vh;
	}

	.slide:last-of-type {
		padding-bottom: 50vh;
	}

	.slide-content {
		width: 100%;
		max-width: 36rem;
		padding: 1.25rem 1.5rem;
		font-family: var(--font-body);
		background: var(--slide-surface-bg, var(--color-white));
		border-top: 2px solid var(--color-teal-light);
		border-bottom: 2px solid var(--color-teal-light);
		box-shadow: var(--slide-surface-shadow, 0 4px 24px rgba(3, 31, 67, 0.1));
		pointer-events: auto;
	}

	.slide.active .slide-content {
		border-color: var(--color-teal);
	}

	.slide-text {
		font-size: clamp(1rem, 2vw, 1.125rem);
		line-height: 1.55;
		margin: 0 0 0.75rem 0;
		color: var(--color-navy);
	}

	.slide-text:last-child {
		margin-bottom: 0;
	}

	.slide-text :global(.text-highlight) {
		font-weight: var(--font-weight-regular);
	}

	.slide-text :global(.highlight-orange) {
		color: var(--color-orange);
	}

	.slide-text :global(.highlight-teal) {
		color: var(--color-teal);
	}

	.slide-text :global(.highlight-yellow) {
		color: var(--color-yellow-dark);
	}

	.slide-text :global(.highlight-purple) {
		color: var(--color-purple);
	}

	.slide-text :global(.highlight-gray) {
		color: var(--color-region-gray);
	}

	@media (max-width: 768px) {
		.slide {
			height: 150vh;
			padding: 0 0.75rem;
		}

		.slide-text {
			font-size: 1rem;
		}
	}
</style>
