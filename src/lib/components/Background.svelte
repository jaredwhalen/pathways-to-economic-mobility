<script>
	import { slides } from '$lib/data/copy.js';
	import {
		BACKGROUND_LAYERS,
		SLIDES_WITH_BACKGROUNDS
	} from '$lib/data/slideBackgrounds.js';

	let { slideId = slides[0]?.id ?? '', slideCount = 0, slideOffset = 0 } = $props();

	const accents = [
		'var(--finding-01)',
		'var(--finding-02)',
		'var(--finding-03)',
		'var(--finding-04)'
	];

	let accent = $derived(
		accents[Math.max(0, slides.findIndex((slide) => slide.id === slideId)) % accents.length]
	);
	let humanIndex = $derived(slides.findIndex((slide) => slide.id === slideId) + 1);
	let showPlaceholder = $derived(slideId && !SLIDES_WITH_BACKGROUNDS.has(slideId));
</script>

<div class="background-stack">
	{#each BACKGROUND_LAYERS as layer (layer.id)}
		<div
			class="background-layer section-theme-{layer.theme} {layer.id}-layer"
			class:is-active={layer.slideIds.includes(slideId)}
		>
			<layer.component
				{slideId}
				{slideOffset}
				isActive={layer.slideIds.includes(slideId)}
			/>
		</div>
	{/each}

	{#if showPlaceholder}
		<div class="background-layer section-theme-light placeholder-layer is-active">
			<div class="background-root" style:--slide-accent={accent}>
				<div class="background-inner">
					<span class="slide-marker" aria-hidden="true">{humanIndex}</span>
					{#if slideCount > 0}
						<span class="slide-total" aria-hidden="true">of {slideCount}</span>
					{/if}
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.background-stack {
		position: relative;
		width: 100%;
		height: 100%;
		min-height: 100%;
	}

	.background-layer {
		position: absolute;
		inset: 0;
		opacity: 0;
		transition: opacity 450ms ease-in-out;
		pointer-events: none;
	}

	.background-layer.is-active {
		opacity: 1;
		pointer-events: auto;
	}

	.background-root {
		width: 100%;
		height: 100%;
		min-height: 100%;
		box-sizing: border-box;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.background-inner {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
		color: var(--slide-accent);
		opacity: 0.35;
		user-select: none;
	}

	.slide-marker {
		font-family: var(--font-display);
		font-size: clamp(4rem, 20vw, 12rem);
		line-height: 1;
		font-weight: var(--font-weight-regular);
	}

	.slide-total {
		font-family: var(--font-body);
		font-size: clamp(0.875rem, 2vw, 1.25rem);
		font-weight: var(--font-weight-light);
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}
</style>
