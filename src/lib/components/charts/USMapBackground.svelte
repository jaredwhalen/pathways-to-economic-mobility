<script>
	import {
		mapStates,
		mapSize,
		opportunitySites,
		caseStudyHighlightStates,
		caseStudyStateIds,
		statesWithoutOpportunitySchools
	} from '$lib/data/mapSites.js';
	import { popDot } from '$lib/utils/mapDot.js';
	import { getSlideIndex } from '$lib/data/copy.js';
	import { easeInOutCubic, lerp } from '$lib/utils/ease.js';
	import { assetUrl } from '$lib/utils/assetUrl.js';

	/** @type {{ slideId?: string }} */
	let { slideId = 'regional-opportunity' } = $props();

	const FADE_MS = 280;
	const ENTER_DELAY_MS = 400;
	const DOT_ENTER_MS = 450;
	const OPPORTUNITY_SPREAD_MS = 1400;
	const IMAGE_FADE_MS = 400;
	const IMAGE_STAGGER_MS = 120;
	const IMAGE_SLIDE_PX = 72;

	/** Placeholder images — swap paths when final assets are ready */
	const CASE_STUDY_PHOTOS = [
		assetUrl('/images/public-agenda-engagement.webp'),
		assetUrl('/images/public-agenda-engagement.webp')
	];

	const SOURCE = 'Source: CCIHE Opportunity College and Universities';
	const OPPORTUNITY_R = 3.5;
	const OPPORTUNITY_DIM = 1;
	const OPPORTUNITY_COLOR = '#318793';

	/** @typedef {{ opportunityDim: number, caseStudyStatesOpacity: number, photo1Opacity: number, photo2Opacity: number, photo1Progress: number, photo2Progress: number, opportunityEnterGen: number, caseStudyEnterGen: number, opportunityRest: boolean }} MapFrame */

	let frame = /** @type {MapFrame} */ ($state({
		opportunityDim: 0,
		caseStudyStatesOpacity: 0,
		photo1Opacity: 0,
		photo2Opacity: 0,
		photo1Progress: 0,
		photo2Progress: 0,
		opportunityEnterGen: 0,
		caseStudyEnterGen: 0,
		opportunityRest: false
	}));

	let sequenceId = 0;
	let rafId = 0;
	let prevSlideId = '';

	/** @param {Partial<MapFrame>} target @param {number} duration */
	function animateProps(target, duration) {
		return new Promise((resolve) => {
			const from = { ...frame };
			const keys = /** @type {(keyof MapFrame)[]} */ (Object.keys(target));
			const start = performance.now();

			cancelAnimationFrame(rafId);

			const tick = (now) => {
				const t = Math.min(1, (now - start) / duration);
				const e = easeInOutCubic(t);
				const next = { ...frame };

				for (const key of keys) {
					const a = from[key];
					const b = target[key];
					if (typeof a === 'number' && typeof b === 'number') {
						next[key] = lerp(a, b, e);
					}
				}

				frame = next;

				if (t < 1) {
					rafId = requestAnimationFrame(tick);
				} else {
					resolve(undefined);
				}
			};

			rafId = requestAnimationFrame(tick);
		});
	}

	/** @param {number} ms */
	function wait(ms) {
		const id = sequenceId;
		return new Promise((resolve) => {
			setTimeout(() => resolve(id === sequenceId), ms);
		});
	}

	/** @param {number} progress @param {'left' | 'right'} side */
	function photoTransform(progress, side) {
		const scale = lerp(0.94, 1, progress);
		if (side === 'left') {
			const x = lerp(-IMAGE_SLIDE_PX, 0, progress);
			const y = lerp(-IMAGE_SLIDE_PX, 0, progress);
			return `translate(${x}px, ${y}px) scale(${scale})`;
		}
		const x = lerp(IMAGE_SLIDE_PX, 0, progress);
		const y = lerp(IMAGE_SLIDE_PX, 0, progress);
		return `translate(${x}px, ${y}px) scale(${scale})`;
	}

	async function enterOpportunity() {
		const id = ++sequenceId;

		frame = {
			opportunityDim: 0,
			caseStudyStatesOpacity: 0,
			photo1Opacity: 0,
			photo2Opacity: 0,
			photo1Progress: 0,
			photo2Progress: 0,
			opportunityEnterGen: 0,
			caseStudyEnterGen: frame.caseStudyEnterGen,
			opportunityRest: false
		};

		await wait(ENTER_DELAY_MS);
		if (id !== sequenceId) return;

		frame = {
			...frame,
			opportunityDim: OPPORTUNITY_DIM,
			opportunityEnterGen: frame.opportunityEnterGen + 1
		};
		await wait(OPPORTUNITY_SPREAD_MS + DOT_ENTER_MS);
	}

	function showOpportunityRest() {
		sequenceId++;
		cancelAnimationFrame(rafId);
		frame = {
			opportunityDim: OPPORTUNITY_DIM,
			caseStudyStatesOpacity: 0,
			photo1Opacity: 0,
			photo2Opacity: 0,
			photo1Progress: 0,
			photo2Progress: 0,
			opportunityEnterGen: Math.max(frame.opportunityEnterGen, 1),
			caseStudyEnterGen: frame.caseStudyEnterGen,
			opportunityRest: true
		};
	}

	async function transitionFromCaseStudy() {
		const id = ++sequenceId;

		await animateProps(
			{
				opportunityDim: OPPORTUNITY_DIM,
				caseStudyStatesOpacity: 0,
				photo1Opacity: 0,
				photo2Opacity: 0,
				photo1Progress: 0,
				photo2Progress: 0
			},
			FADE_MS
		);
		if (id !== sequenceId) return;

		frame = { ...frame, opportunityRest: true };
	}

	async function transitionToCaseStudy() {
		const id = ++sequenceId;

		await animateProps({ opportunityDim: 0 }, FADE_MS);
		if (id !== sequenceId) return;

		frame = {
			...frame,
			caseStudyStatesOpacity: 1,
			caseStudyEnterGen: frame.caseStudyEnterGen + 1
		};

		await animateProps({ photo1Opacity: 1, photo1Progress: 1 }, IMAGE_FADE_MS);
		if (id !== sequenceId) return;

		await wait(IMAGE_STAGGER_MS);
		if (id !== sequenceId) return;

		await animateProps({ photo2Opacity: 1, photo2Progress: 1 }, IMAGE_FADE_MS);
	}

	$effect(() => {
		const id = slideId;
		if (id === prevSlideId) return;

		const prevIndex = getSlideIndex(prevSlideId);
		const currentIndex = getSlideIndex(id);
		const direction = currentIndex > prevIndex ? 'down' : 'up';
		const opportunityIndex = getSlideIndex('regional-opportunity');
		const caseStudyIndex = getSlideIndex('public-agenda');

		if (direction === 'down') {
			if (id === 'regional-opportunity' && prevIndex < opportunityIndex) enterOpportunity();
			else if (id === 'public-agenda' && prevIndex < caseStudyIndex) transitionToCaseStudy();
		} else if (direction === 'up') {
			if (id === 'regional-opportunity' && prevSlideId === 'public-agenda')
				transitionFromCaseStudy();
			else if (id === 'regional-opportunity') showOpportunityRest();
		}

		prevSlideId = id;
	});

	$effect(() => {
		return () => {
			cancelAnimationFrame(rafId);
			sequenceId++;
		};
	});

	let opportunityAnimated = $derived(frame.opportunityEnterGen > 0);
	let caseStudyStatesAnimated = $derived(frame.caseStudyEnterGen > 0);
	let sourceOpacity = $derived(Math.max(frame.opportunityDim, frame.caseStudyStatesOpacity));
	let isCaseStudyMap = $derived(slideId === 'public-agenda');

	/** @param {string} stateId */
	function isMutedState(stateId) {
		return (
			statesWithoutOpportunitySchools.has(stateId) ||
			(isCaseStudyMap && !caseStudyStateIds.includes(stateId))
		);
	}
</script>

<div class="us-map">
	<div class="map-stage">
		<svg
		class="map-svg"
		viewBox="0 0 {mapSize.width} {mapSize.height}"
		preserveAspectRatio="xMidYMid meet"
		role="img"
		aria-label="United States map"
	>
		<g class="states">
			{#each mapStates as state (state.id)}
				<path
					d={state.d}
					class="state"
					class:state-empty={isMutedState(state.id)}
					fill-rule="evenodd"
				/>
			{/each}
		</g>

		<g class="opportunity-layer" style:opacity={frame.opportunityDim}>
			{#each opportunitySites as site, i (site.key)}
				{@const delay = (i / Math.max(opportunitySites.length - 1, 1)) * OPPORTUNITY_SPREAD_MS}
				{@const showDot =
					frame.opportunityRest ||
					(opportunityAnimated && frame.opportunityEnterGen > 0)}
				<circle
					class="opportunity-dot"
					cx={site.x}
					cy={site.y}
					fill={OPPORTUNITY_COLOR}
					use:popDot={{
						animate: showDot && !frame.opportunityRest,
						visible: frame.opportunityRest,
						gen: frame.opportunityEnterGen,
						delay: frame.opportunityRest ? 0 : delay,
						duration: DOT_ENTER_MS,
						r: OPPORTUNITY_R
					}}
				/>
			{/each}
		</g>

		<g class="case-study-states-layer" style:opacity={frame.caseStudyStatesOpacity}>
			{#key frame.caseStudyEnterGen}
				{#each caseStudyHighlightStates as state (state.id)}
					<path
						d={state.d}
						class="case-study-state"
						class:animated={caseStudyStatesAnimated}
						fill-rule="evenodd"
					/>
				{/each}
			{/key}
		</g>
	</svg>
	</div>

	<div class="bg-photos" aria-hidden="true">
		<figure
			class="bg-photo bg-photo-left"
			style:opacity={frame.photo1Opacity}
			style:transform={photoTransform(frame.photo1Progress, 'left')}
		>
			<img src={CASE_STUDY_PHOTOS[0]} alt="" />
		</figure>
		<figure
			class="bg-photo bg-photo-right"
			style:opacity={frame.photo2Opacity}
			style:transform={photoTransform(frame.photo2Progress, 'right')}
		>
			<img src={CASE_STUDY_PHOTOS[1]} alt="" />
		</figure>
	</div>

	<p class="chart-source" style:opacity={sourceOpacity}>{SOURCE}</p>
</div>

<style>
	.us-map {
		position: relative;
		width: 100%;
		height: 100dvh;
		min-height: 100dvh;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--color-white);
		overflow: hidden;
	}

	.map-stage {
		position: relative;
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: visible;
	}

	.bg-photos {
		position: absolute;
		inset: 0;
		pointer-events: none;
		z-index: 2;
	}

	.bg-photo {
		position: absolute;
		margin: 0;
		overflow: hidden;
		background: var(--color-white);
		padding: 0.3rem;
		box-shadow:
			0 1px 0 rgba(25, 31, 47, 0.05),
			0 20px 40px rgba(25, 31, 47, 0.12),
			0 48px 80px rgba(25, 31, 47, 0.08);
		will-change: transform, opacity;
	}

	.bg-photo::before {
		content: '';
		position: absolute;
		inset: 0;
		border: 1px solid rgba(25, 31, 47, 0.08);
		pointer-events: none;
		z-index: 1;
	}

	.bg-photo-left {
		top: clamp(1rem, 4vh, 2.5rem);
		left: clamp(1rem, 3vw, 2rem);
		width: clamp(200px, 42vw, 440px);
		aspect-ratio: 5 / 4;
		transform-origin: top left;
	}

	.bg-photo-right {
		bottom: clamp(1rem, 4vh, 2.5rem);
		right: clamp(1rem, 3vw, 2rem);
		width: clamp(220px, 44vw, 480px);
		aspect-ratio: 4 / 3;
		transform-origin: bottom right;
	}

	.bg-photo img {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.map-svg {
		position: relative;
		z-index: 1;
		flex: 1 1 auto;
		width: 100%;
		height: auto;
		max-height: min(100dvh, 720px);
		display: block;
		overflow: visible;
	}

	.map-svg :global(.state) {
		fill: var(--map-state-fill);
		stroke: #c5d9dc;
		stroke-width: 1;
		transition:
			fill 400ms ease-in-out,
			stroke 400ms ease-in-out;
	}

	.map-svg :global(.state.state-empty) {
		fill: var(--map-state-empty);
		stroke: #d0d0d0;
	}

	.map-svg :global(.opportunity-dot) {
		stroke: var(--color-white);
		stroke-width: 1.5;
		paint-order: stroke fill;
	}

	.map-svg :global(.case-study-state) {
		fill: #318793;
		stroke: #26737c;
		stroke-width: 1;
		opacity: 0;
	}

	.map-svg :global(.case-study-state.animated) {
		animation: case-study-state-enter 450ms ease-out forwards;
	}

	@keyframes case-study-state-enter {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.map-svg :global(.state) {
			transition: none;
		}
	}

	.chart-source {
		position: absolute;
		left: 0;
		bottom: 0;
		z-index: 3;
		margin: 0;
		padding: 0 1.25rem 1rem;
		font-family: var(--font-body);
		font-size: 0.625rem;
		line-height: 1.4;
		color: var(--color-teal);
		transition: opacity 0.15s linear;
	}
</style>
