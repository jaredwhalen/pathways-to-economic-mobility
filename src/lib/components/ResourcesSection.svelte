<script>
	import { onMount } from 'svelte';
	import { resources, getResourceUrl } from '$lib/data/resources.js';
	import { resourcesIntro } from '$lib/data/copy.js';
	import { formatSlideParagraph } from '$lib/utils/parseSlideText.js';
	import ResourcePathway from '$lib/components/ResourcePathway.svelte';
	import { revealOnScroll } from '$lib/actions/revealOnScroll.js';
	import { assetUrl } from '$lib/utils/assetUrl.js';
	import { dev } from '$app/environment';

	let introHtml = $derived(formatSlideParagraph(resourcesIntro));

	
	let pathwayStage;

	
	let pathwayNodes = $state([]);

	let pathRevealed = $state(false);

	function updatePathwayNodes() {
		if (!pathwayStage) return;

		const stageRect = pathwayStage.getBoundingClientRect();
		if (stageRect.width <= 0 || stageRect.height <= 0) return;

		const items = pathwayStage.querySelectorAll('.pathway-item');
		pathwayNodes = Array.from(items).map((item) => {
			const rect = item.getBoundingClientRect();

			return {
				x: ((rect.left + rect.right) / 2 - stageRect.left) / stageRect.width * 100,
				y: ((rect.top + rect.bottom) / 2 - stageRect.top) / stageRect.height * 100
			};
		});
	}

	onMount(() => {
		if (!pathwayStage) return;

		updatePathwayNodes();

		const pathObserver = new IntersectionObserver(
			([entry]) => {
				if (entry?.isIntersecting) {
					pathRevealed = true;
					pathObserver.disconnect();
				}
			},
			{ threshold: 0.05 }
		);

		pathObserver.observe(pathwayStage);

		const resizeObserver = new ResizeObserver(updatePathwayNodes);
		resizeObserver.observe(pathwayStage);

		for (const item of pathwayStage.querySelectorAll('.pathway-item')) {
			resizeObserver.observe(item);
		}

		for (const image of pathwayStage.querySelectorAll('.resource-media img')) {
			image.addEventListener('load', updatePathwayNodes);
		}

		window.addEventListener('resize', updatePathwayNodes);

		return () => {
			pathObserver.disconnect();
			resizeObserver.disconnect();
			window.removeEventListener('resize', updatePathwayNodes);

			pathwayStage?.querySelectorAll('.resource-media img').forEach((image) => {
				image.removeEventListener('load', updatePathwayNodes);
			});
		};
	});
</script>

<section id="toolkit" class="resources-section" aria-labelledby="resources-heading">
	<div class="resources-inner emcs-content">
		<header class="resources-header" use:revealOnScroll>
			<h2 id="resources-heading" class="resources-heading">Toolkit &amp; resources</h2>
			<p class="resources-intro">{@html introHtml}</p>
		</header>

		<div class="pathway-stage" bind:this={pathwayStage}>
			<div class="pathway-backdrop">
				<ResourcePathway nodes={pathwayNodes} revealed={pathRevealed} />
			</div>

			<ul class="pathway-grid">
				{#each resources as resource (resource.id)}
					<li
						class="pathway-item"
						class:pathway-item-center={resource.placement === 'center'}
						class:pathway-item-left={resource.placement === 'left'}
						class:pathway-item-right={resource.placement === 'right'}
						use:revealOnScroll
					>
						<a
							class="resource-row"
							class:resource-row-left={resource.placement === 'left' || resource.placement === 'center'}
							class:resource-row-right={resource.placement === 'right'}
							href={getResourceUrl(resource.path)}
							target={dev ? '_blank' : undefined}
							rel={dev ? 'noopener noreferrer' : undefined}
						>
							<div class="resource-media">
								<img src={assetUrl(resource.thumbnail)} alt="" loading="lazy" decoding="async" />
							</div>
							<div class="resource-body">
								<h3 class="resource-title">{resource.title}</h3>
								<p class="resource-description">{resource.description}</p>
								<span class="resource-link-label">View resource</span>
							</div>
						</a>
					</li>
				{/each}
			</ul>
		</div>
	</div>
</section>

<style>
	.resources-section {
		position: relative;
		z-index: 3;
		background: var(--color-off-white);
		border-top: 2px solid var(--color-teal-light);
		padding: clamp(3rem, 8vw, 5rem) 0 clamp(4rem, 10vw, 6rem);
		pointer-events: auto;
	}

	.resources-inner {
		display: flex;
		flex-direction: column;
		gap: clamp(2rem, 5vw, 3rem);
	}

	.resources-header {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		max-width: 42rem;
		opacity: 0;
		transform: translateY(1.25rem);
		transition:
			opacity 650ms ease,
			transform 650ms ease;
	}

	.resources-header:global(.is-revealed) {
		opacity: 1;
		transform: translateY(0);
	}

	.resources-heading {
		margin: 0;
		font-family: var(--font-display);
		font-size: clamp(1.75rem, 4vw, 2.5rem);
		font-weight: var(--font-weight-regular);
		line-height: 1.2;
		color: var(--color-navy);
	}

	.resources-intro {
		margin: 0;
		font-size: clamp(1rem, 2vw, 1.125rem);
		line-height: 1.55;
		color: var(--color-navy);
	}

	.pathway-stage {
		position: relative;
		isolation: isolate;
	}

	.pathway-backdrop {
		position: absolute;
		inset: 0;
		z-index: 0;
		pointer-events: none;
	}

	.pathway-grid {
		position: relative;
		z-index: 1;
		display: grid;
		grid-template-columns: repeat(12, minmax(0, 1fr));
		gap: clamp(3rem, 7vw, 5rem) clamp(1rem, 2vw, 1.5rem);
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.pathway-item {
		min-width: 0;
		opacity: 0;
		transition:
			opacity 700ms ease,
			transform 700ms cubic-bezier(0.22, 1, 0.36, 1);
	}

	.pathway-item-center {
		grid-column: 2 / 12;
		transform: translateY(2rem);
	}

	.pathway-item-left {
		grid-column: 1 / 8;
		transform: translate(-1.75rem, 2rem);
	}

	.pathway-item-right {
		grid-column: 6 / 13;
		transform: translate(1.75rem, 2rem);
	}

	.pathway-item:global(.is-revealed) {
		opacity: 1;
		transform: translate(0, 0);
	}

	.resource-row {
		display: grid;
		align-items: stretch;
		height: 100%;
		text-decoration: none;
		color: inherit;
		background: var(--color-white);
		border: 1px solid var(--color-teal-light);
		box-shadow: 0 4px 24px rgba(3, 31, 67, 0.08);
		transition:
			border-color 180ms ease,
			box-shadow 180ms ease,
			transform 180ms ease;
		overflow: hidden;
	}

	.resource-row-left {
		grid-template-columns: minmax(7.5rem, 38%) minmax(0, 1fr);
	}

	.resource-row-right {
		grid-template-columns: minmax(0, 1fr) minmax(7.5rem, 38%);
	}

	.resource-row-right .resource-media {
		order: 2;
	}

	.resource-row-right .resource-body {
		order: 1;
	}

	.resource-row:hover,
	.resource-row:focus-visible {
		border-color: var(--color-teal);
		box-shadow: 0 8px 32px rgba(3, 31, 67, 0.14);
		transform: translateY(-2px);
		outline: none;
	}

	.resource-row:focus-visible {
		box-shadow:
			0 8px 32px rgba(3, 31, 67, 0.14),
			0 0 0 3px rgba(49, 135, 147, 0.35);
	}

	.resource-media {
		min-height: 9rem;
		background: var(--color-teal-dark);
	}

	.resource-media img {
		display: block;
		width: 100%;
		height: 100%;
		min-height: inherit;
		object-fit: cover;
	}

	.resource-body {
		display: flex;
		flex-direction: column;
		justify-content: center;
		gap: 0.5rem;
		padding: clamp(1rem, 2.5vw, 1.5rem);
	}

	.resource-title {
		margin: 0;
		font-family: var(--font-display);
		font-size: clamp(1.0625rem, 2vw, 1.25rem);
		font-weight: var(--font-weight-regular);
		line-height: 1.25;
		color: var(--color-navy);
	}

	.resource-description {
		margin: 0;
		font-size: clamp(0.9375rem, 1.6vw, 1rem);
		line-height: 1.45;
		color: var(--color-navy);
		opacity: 0.88;
	}

	.resource-link-label {
		margin-top: 0.25rem;
		font-size: 0.75rem;
		font-weight: var(--font-weight-regular);
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--color-teal);
	}

	@media (prefers-reduced-motion: reduce) {
		.resources-header,
		.pathway-item {
			opacity: 1;
			transform: none;
			transition: none;
		}
	}

	@media (max-width: 900px) {
		.pathway-grid {
			gap: clamp(2.5rem, 6.5vw, 4rem) clamp(1rem, 2vw, 1.5rem);
		}

		.pathway-item-center,
		.pathway-item-left,
		.pathway-item-right {
			grid-column: 1 / -1;
		}

		.pathway-item-left {
			transform: translate(-1.25rem, 2rem);
		}

		.pathway-item-right {
			transform: translate(1.25rem, 2rem);
		}

		.pathway-item-left:global(.is-revealed),
		.pathway-item-right:global(.is-revealed) {
			transform: translate(0, 0);
		}
	}

	@media (max-width: 600px) {
		.pathway-backdrop {
			opacity: 0.65;
		}

		.pathway-item-left,
		.pathway-item-right {
			transform: translateY(2rem);
		}

		.resource-row-left,
		.resource-row-right {
			grid-template-columns: 1fr;
		}

		.resource-row-right .resource-media {
			order: -1;
		}

		.resource-media {
			min-height: 11rem;
		}
	}
</style>
