<script>
	import { slides } from '$lib/data/copy.js';
	import '$lib/styles/emcs.css';
	import FontFaces from '$lib/components/FontFaces.svelte';
	import Scroller from '$lib/components/Scroller.svelte';
	import Slide from '$lib/components/Slide.svelte';
	import Background from '$lib/components/Background.svelte';
	import ScrollerDebug from '$lib/components/ScrollerDebug.svelte';
	import ScrollerProgress from '$lib/components/ScrollerProgress.svelte';
	import ResourcesSection from '$lib/components/ResourcesSection.svelte';
	import { getSlideTheme } from '$lib/data/slideBackgrounds.js';
	import { dev } from '$app/environment';

	let index = $state(0);
	let count = $state(0);
	let progress = $state(0);
	let offset = $state(0);
	let visible = $state(false);

	let activeSlideId = $derived(slides[index]?.id ?? '');
	let activeSlideTheme = $derived(getSlideTheme(activeSlideId));
</script>

<FontFaces />

<div class="emcs-scroll theme-light">
	<Scroller bind:index bind:count bind:progress bind:offset bind:visible>
		<ScrollerProgress
			slot="progress"
			{index}
			{count}
			{offset}
			{visible}
			theme={activeSlideTheme}
		/>
		<div slot="background" class="scroller-background-slot">
			<Background slideId={activeSlideId} slideCount={count} slideOffset={offset} />
		</div>
		<div slot="foreground">
			{#each slides as slide (slide.id)}
				<Slide {slide} isActive={activeSlideId === slide.id} />
			{/each}
		</div>
	</Scroller>

	<ResourcesSection />

	{#if dev}
		<ScrollerDebug {index} {count} {progress} {offset} {visible} />
	{/if}
</div>

<style>
	:global(.scroller-background-slot) {
		width: 100%;
		height: 100dvh;
		min-height: 100dvh;
	}
</style>
