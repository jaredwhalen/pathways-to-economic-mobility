<script>
	import { resources, resourcesIntro, getResourceUrl } from '$lib/data/copy.js';
	import { formatSlideParagraph } from '$lib/utils/parseSlideText.js';
	import { revealOnScroll } from '$lib/actions/revealOnScroll.js';
	import { assetUrl } from '$lib/utils/assetUrl.js';
	import { dev } from '$app/environment';

	let introParagraphs = $derived(
		resourcesIntro
			.split(/\n\s*\n/)
			.map((paragraph) => paragraph.trim())
			.filter((paragraph) => paragraph.length > 0)
			.map((paragraph) => formatSlideParagraph(paragraph))
	);
</script>

<section id="toolkit" class="resources-section" aria-labelledby="resources-heading">
	<div class="resources-inner emcs-content">
		<header class="resources-header" use:revealOnScroll>
			<h2 id="resources-heading" class="resources-heading">Toolkit &amp; resources</h2>
			<div class="resources-intro-copy">
				{#each introParagraphs as paragraph}
					<p class="resources-intro">{@html paragraph}</p>
				{/each}
			</div>
		</header>

		<ul class="resources-grid">
			{#each resources as resource (resource.id)}
				<li class="resources-grid-item" use:revealOnScroll>
					<a
						class="resource-card"
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
						</div>
					</a>
				</li>
			{/each}
		</ul>
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
		gap: 1.25rem;
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
		font-size: clamp(2.25rem, 3.5vw, 3.25rem);
		font-weight: var(--font-weight-regular);
		line-height: 1.15;
		color: var(--color-near-black);
	}

	.resources-intro-copy {
		display: flex;
		flex-direction: column;
		gap: 0;
	}

	.resources-intro {
		margin: 0 0 var(--text-body-margin-bottom);
		font-family: var(--font-body);
		font-weight: var(--font-weight-regular);
		font-size: var(--text-body-size);
		line-height: var(--text-body-leading);
		color: var(--text-body-color);
	}

	.resources-intro:last-child {
		margin-bottom: 0;
	}

	.resources-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: clamp(1.25rem, 2.5vw, 1.75rem);
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.resources-grid-item {
		min-width: 0;
		opacity: 0;
		transform: translateY(1.5rem);
		transition:
			opacity 700ms ease,
			transform 700ms cubic-bezier(0.22, 1, 0.36, 1);
	}

	.resources-grid-item:global(.is-revealed) {
		opacity: 1;
		transform: translateY(0);
	}

	.resource-card {
		display: flex;
		flex-direction: column;
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

	.resource-card:hover,
	.resource-card:focus-visible {
		border-color: var(--color-teal);
		box-shadow: 0 8px 32px rgba(3, 31, 67, 0.14);
		transform: translateY(-2px);
		outline: none;
	}

	.resource-card:focus-visible {
		box-shadow:
			0 8px 32px rgba(3, 31, 67, 0.14),
			0 0 0 3px rgba(49, 135, 147, 0.35);
	}

	.resource-media {
		aspect-ratio: 16 / 10;
		background: var(--color-teal-dark);
		overflow: hidden;
	}

	.resource-media img {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform 280ms ease;
	}

	.resource-card:hover .resource-media img,
	.resource-card:focus-visible .resource-media img {
		transform: scale(1.03);
	}

	.resource-body {
		display: flex;
		flex: 1;
		flex-direction: column;
		gap: 0.5rem;
		padding: clamp(1rem, 2vw, 1.25rem);
	}

	.resource-title {
		margin: 0;
		align-self: flex-start;
		font-family: var(--font-display);
		font-size: clamp(1.4375rem, 0.4746835443vw + 1.2096518987rem, 1.625rem);
		font-weight: 500;
		line-height: clamp(1.75rem, 1.2658227848vw + 1.1424050633rem, 2.25rem);
		color: var(--color-navy);
		background-image: linear-gradient(var(--color-near-black), var(--color-near-black));
		background-position: 0 100%;
		background-repeat: no-repeat;
		background-size: 0% 2px;
		transition: background-size 280ms ease;
	}

	.resource-card:hover .resource-title,
	.resource-card:focus-visible .resource-title {
		background-size: 100% 2px;
	}

	.resource-description {
		margin: 0;
		flex: 1;
		font-family: var(--font-body);
		font-weight: var(--font-weight-regular);
		font-size: clamp(0.9375rem, 1.6vw, 1.0625rem);
		line-height: 1.45;
		color: var(--text-body-color);
	}

	@media (prefers-reduced-motion: reduce) {
		.resources-header,
		.resources-grid-item {
			opacity: 1;
			transform: none;
			transition: none;
		}

		.resource-title {
			transition: none;
		}

		.resource-card:hover .resource-title,
		.resource-card:focus-visible .resource-title {
			background-size: 100% 2px;
		}

		.resource-media img {
			transition: none;
		}

		.resource-card:hover .resource-media img,
		.resource-card:focus-visible .resource-media img {
			transform: none;
		}
	}

	@media (max-width: 560px) {
		.resources-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
