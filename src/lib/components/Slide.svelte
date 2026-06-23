<script>
	import PublicOpinionChart from "$lib/components/PublicOpinionChart.svelte";
	import CompletionAlignVisual from "$lib/components/slides/completion/CompletionAlignVisual.svelte";
	import { getSlideIndex } from "$lib/data/copy.js";
	import {
		formatSlideParagraph,
		parseAlignSlide,
	} from "$lib/utils/parseSlideText.js";

	const FINDING_ACCENTS = {
		"open-doors": "var(--finding-01)",
		completion: "var(--finding-02)",
		"regional-reciprocity": "var(--finding-03)",
		"culture-of-success": "var(--finding-04)",
	};

	let { slide, isActive, activeIndex = 0 } = $props();

	let alignContent = $derived(
		slide.text ? parseAlignSlide(slide.text) : null,
	);

	let paragraphs = $derived(
		alignContent || !slide.text
			? []
			: slide.text
					.split(/\n\s*\n/)
					.map((paragraph) => paragraph.trim())
					.filter((paragraph) => paragraph.length > 0)
					.map((paragraph) => formatSlideParagraph(paragraph)),
	);

	let findingAccent = $derived(
		slide.eyebrow
			? (FINDING_ACCENTS[slide.id] ?? "var(--color-teal)")
			: null,
	);

	let alignPassed = $derived(
		alignContent ? activeIndex > getSlideIndex(slide.id) : false,
	);

	function skipToToolkit(event) {
		event.preventDefault();
		document
			.getElementById("toolkit")
			?.scrollIntoView({ block: "start", behavior: "instant" });
	}
</script>

<section
	class="slide"
	class:active={isActive}
	class:slide-regional-opportunity={slide.id === "regional-opportunity"}
	class:slide-public-agenda={slide.id === "public-agenda"}
>
	<div
		class="slide-content"
		class:has-eyebrow={Boolean(slide.eyebrow)}
		style:--slide-eyebrow-accent={findingAccent}
	>
		{#if slide.eyebrow}
			<p class="slide-eyebrow">{slide.eyebrow}</p>
		{/if}
		{#if alignContent}
			<p class="sr-only">{alignContent.srText}</p>
			<div class="completion-body" aria-hidden="true">
				{#if alignContent.textLead}
					<p class="slide-text completion-lead">
						{@html formatSlideParagraph(alignContent.textLead)}
					</p>
				{/if}
				<CompletionAlignVisual
					phrases={alignContent.alignPhrases}
					active={isActive}
					passed={alignPassed}
				/>
				{#if alignContent.textTail}
					<p class="slide-text completion-tail">
						{@html formatSlideParagraph(alignContent.textTail)}
					</p>
				{/if}
			</div>
		{:else}
			{#each paragraphs as paragraph}
				<p class="slide-text">{@html paragraph}</p>
			{/each}
		{/if}
		{#if slide.showChart}
			<PublicOpinionChart active={isActive} />
		{/if}
		{#if slide.id === "opening" && isActive}
			<a class="skip-to-toolkit" href="#toolkit" onclick={skipToToolkit}>
				Skip intro
				<span class="skip-arrow" aria-hidden="true"></span>
			</a>
		{/if}
	</div>
</section>

<style>
	.slide {
		height: 150dvh;
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
		position: relative;
		isolation: isolate;
		width: 100%;
		max-width: 35rem;
		padding: 1.5rem 1.75rem;
		font-family: var(--font-body);
		background: transparent;
		border: 1px solid var(--slide-surface-border-inner, var(--color-teal));
		box-shadow: var(
			--slide-surface-shadow,
			0 2px 20px rgba(3, 31, 67, 0.08)
		);
		border-radius: 2px;
		pointer-events: auto;
		opacity: 0.5;
		transition: opacity 400ms ease;

		@media (max-width: 768px) {
			padding: 0.75rem 1rem;
		}
	}

	.slide.active .slide-content {
		opacity: 1;
	}

	.slide-content::before {
		content: "";
		position: absolute;
		inset: 0;
		z-index: -1;
		border-radius: inherit;
		background: var(--slide-surface-bg, rgba(255, 255, 255, 0.8));
		backdrop-filter: blur(var(--slide-surface-blur, 18px));
		-webkit-backdrop-filter: blur(var(--slide-surface-blur, 18px));
		pointer-events: none;
	}

	.slide-content::after {
		content: "";
		position: absolute;
		inset: calc(-1 * var(--slide-surface-border-gap, 5px));
		border: 1px solid
			var(--slide-surface-border-outer, var(--color-teal-light));
		border-radius: calc(2px + var(--slide-surface-border-gap, 5px));
		pointer-events: none;
	}

	.slide-content.has-eyebrow {
		--slide-surface-border-inner: var(
			--slide-eyebrow-accent,
			var(--color-teal)
		);
	}

	.slide-eyebrow {
		margin: 0 0 0.875rem;
		padding-left: 0.625rem;
		border-left: 3px solid var(--slide-eyebrow-accent, var(--color-teal));
		font-family: var(--font-body);
		font-size: clamp(0.8125rem, 2.5vw, 1rem);
		font-weight: var(--font-weight-regular);
		letter-spacing: 0.06em;
		line-height: 1.3;
		text-transform: uppercase;
		color: var(--slide-eyebrow-accent, var(--color-teal));
	}

	.slide-content.has-eyebrow .slide-text:first-of-type {
		margin-top: 0;
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}

	.completion-body .completion-lead {
		margin-bottom: 0.5rem;
	}

	.completion-body .completion-tail {
		margin-bottom: 0;
	}

	.slide-text :global(.text-highlight) {
		font-weight: var(--font-weight-regular);
	}

	.slide-text :global(:is(b, strong)) {
		font-weight: var(--font-weight-bold);
	}

	.slide-text :global(:is(i, em)) {
		font-style: italic;
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

	.slide-regional-opportunity .slide-text :global(.highlight-teal) {
		font-weight: var(--font-weight-bold);
	}

	.slide-public-agenda .slide-text :global(.highlight-teal) {
		font-weight: var(--font-weight-bold);
	}

	.skip-to-toolkit {
		display: flex;
		width: fit-content;
		margin-inline: auto;
		align-items: center;
		gap: 0.35rem;
		margin-top: 1rem;
		padding: 0.5rem 1rem;
		font-family: var(--font-body);
		font-size: 0.8125rem;
		font-weight: var(--font-weight-regular);
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: var(--color-teal);
		text-decoration: none;
		background: rgba(255, 255, 255, 0.6);
		border: 1px solid var(--color-teal-light);
		border-radius: 999px;
		transition:
			background 150ms ease,
			border-color 150ms ease,
			color 150ms ease;
	}

	.skip-to-toolkit:hover,
	.skip-to-toolkit:focus-visible {
		background: rgba(255, 255, 255, 0.9);
		border-color: var(--color-teal);
		color: var(--color-teal-dark);
		outline: none;
	}

	.skip-arrow {
		display: inline-block;
		width: 0.45em;
		height: 0.45em;
		border-right: 0.12em solid currentColor;
		border-bottom: 0.12em solid currentColor;
		transform: translateY(-0.12em) rotate(45deg);
		text-transform: none;
	}

	@media (max-width: 768px) {
		.slide {
			height: 150vh;
			padding: 0 0.75rem;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.slide-content {
			transition: none;
		}
	}
</style>
