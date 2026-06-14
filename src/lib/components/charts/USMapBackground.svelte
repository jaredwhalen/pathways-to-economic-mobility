<script>
	import CaseStudyInstitutionList from '$lib/components/charts/CaseStudyInstitutionList.svelte';
	import {
		mapStates,
		mapSize,
		opportunitySites,
		caseStudySites,
		caseStudyStateIds,
		statesWithoutOpportunitySchools
	} from '$lib/data/mapSites.js';
	import { popDot } from '$lib/utils/mapDot.js';
	import { getSlideIndex } from '$lib/data/copy.js';
	import { easeInOutCubic, lerp } from '$lib/utils/ease.js';
	import {
		animateFlightLeg,
		animateIntroZoom,
		buildTourOrder,
		getOverviewFocus,
		getViewTransform,
		viewTransformString
	} from '$lib/utils/mapFlythrough.js';
	import { getTourLegDuration } from '$lib/utils/mapboxTour.js';

	const tourSites = buildTourOrder(caseStudySites);
	const tourInstitutionNames = tourSites.map((site) => site.id ?? '');
	const overviewFocus = getOverviewFocus(mapSize);
	const firstTourSite = tourSites[0];

	
	let { slideId = 'regional-opportunity' } = $props();

	const FADE_MS = 280;
	const ENTER_DELAY_MS = 400;
	const DOT_ENTER_MS = 450;
	const OPPORTUNITY_SPREAD_MS = 1400;

	const SOURCE = 'Source: CCIHE Opportunity College and Universities';
	const OPPORTUNITY_R = 3.5;
	const OPPORTUNITY_DIM = 1;
	const CASE_STUDY_DOT_R = 4.5;
	const CASE_STUDY_DOT_STROKE = 1.5;
	const CASE_STUDY_RING_STROKE = 2;
	const CASE_STUDY_RING_GAP = 1;
	const CASE_STUDY_RING_R =
		CASE_STUDY_DOT_R + CASE_STUDY_DOT_STROKE / 2 + CASE_STUDY_RING_GAP + CASE_STUDY_RING_STROKE / 2;

	const TOUR_HOLD_MS = 500;
	const TOUR_INTRO_MS = 900;
	const TOUR_PRE_DELAY = 300;
	const TOUR_SITE_SCALE = 2.1;
	const TOUR_OVERVIEW_SCALE = 1;

	

	let frame = $state({
		opportunityDim: 0,
		caseStudySitesOpacity: 0,
		opportunityEnterGen: 0,
		caseStudySitesEnterGen: 0,
		listOverlayOpacity: 0,
		opportunityRest: false,
		caseStudySitesRest: false,
		viewFocusX: overviewFocus.x,
		viewFocusY: overviewFocus.y,
		viewScale: TOUR_OVERVIEW_SCALE,
		planeX: overviewFocus.x,
		planeY: overviewFocus.y,
		planeRotation: 0,
		planeOpacity: 0,
		tourActive: false
	});

	let activeTourIndex = $state(-1);

	let sequenceId = 0;
	let rafId = 0;
	let prevSlideId = '';

	
	function animateProps(target, duration) {
		return new Promise((resolve) => {
			const from = { ...frame };
			const keys = (Object.keys(target));
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

	
	function wait(ms) {
		const id = sequenceId;
		return new Promise((resolve) => {
			setTimeout(() => resolve(id === sequenceId), ms);
		});
	}

	
	function overviewView() {
		return {
			viewFocusX: overviewFocus.x,
			viewFocusY: overviewFocus.y,
			viewScale: TOUR_OVERVIEW_SCALE,
			planeX: overviewFocus.x,
			planeY: overviewFocus.y,
			planeRotation: 0,
			planeOpacity: 0
		};
	}

	async function enterOpportunity() {
		const id = ++sequenceId;

		frame = {
			...frame,
			...overviewView(),
			opportunityDim: 0,
			caseStudySitesOpacity: 0,
			opportunityEnterGen: 0,
			listOverlayOpacity: 0,
			opportunityRest: false,
			caseStudySitesRest: false,
			tourActive: false
		};
		activeTourIndex = -1;

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
			...frame,
			...overviewView(),
			opportunityDim: OPPORTUNITY_DIM,
			caseStudySitesOpacity: 0,
			listOverlayOpacity: 0,
			opportunityEnterGen: Math.max(frame.opportunityEnterGen, 1),
			opportunityRest: true,
			caseStudySitesRest: false,
			tourActive: false
		};
		activeTourIndex = -1;
	}

	async function transitionFromCaseStudy() {
		const id = ++sequenceId;

		await animateProps(
			{
				opportunityDim: OPPORTUNITY_DIM,
				caseStudySitesOpacity: 0,
				listOverlayOpacity: 0
			},
			FADE_MS
		);
		if (id !== sequenceId) return;

		frame = {
			...frame,
			...overviewView(),
			opportunityRest: true,
			caseStudySitesRest: false,
			tourActive: false
		};
		activeTourIndex = -1;
	}

	function showCaseStudyRest() {
		sequenceId++;
		cancelAnimationFrame(rafId);
		frame = {
			opportunityDim: 0,
			caseStudySitesOpacity: 1,
			opportunityEnterGen: frame.opportunityEnterGen,
			caseStudySitesEnterGen: Math.max(frame.caseStudySitesEnterGen, 1),
			listOverlayOpacity: 1,
			opportunityRest: false,
			caseStudySitesRest: true,
			viewFocusX: overviewFocus.x,
			viewFocusY: overviewFocus.y,
			viewScale: TOUR_OVERVIEW_SCALE,
			planeX: overviewFocus.x,
			planeY: overviewFocus.y,
			planeRotation: 0,
			planeOpacity: 0,
			tourActive: false
		};
		activeTourIndex = -1;
	}

	
	async function flyBetween(id, from, to, arrivalIndex) {
		const duration = getTourLegDuration(
			{ lon: from.lon ?? from.x, lat: from.lat ?? from.y, state: from.state },
			{ lon: to.lon ?? to.x, lat: to.lat ?? to.y, state: to.state }
		);

		await animateFlightLeg({
			from: { x: from.x, y: from.y },
			to: { x: to.x, y: to.y },
			fromSite: from,
			toSite: to,
			duration,
			overviewScale: TOUR_OVERVIEW_SCALE,
			siteScale: TOUR_SITE_SCALE,
			shouldContinue: () => id === sequenceId,
			onDepart: () => {
				activeTourIndex = arrivalIndex;
			},
			onUpdate: ({ plane, planeRotation, focus, scale }) => {
				frame = {
					...frame,
					viewFocusX: focus.x,
					viewFocusY: focus.y,
					viewScale: scale,
					planeX: plane.x,
					planeY: plane.y,
					planeRotation,
					planeOpacity: 1
				};
			}
		});
	}

	
	async function startCaseStudyTour(id) {
		if (typeof window !== 'undefined') {
			const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
			if (reducedMotion) {
				showCaseStudyRest();
				return;
			}
		}

		await wait(TOUR_PRE_DELAY);
		if (id !== sequenceId) return;

		frame = {
			...frame,
			viewFocusX: overviewFocus.x,
			viewFocusY: overviewFocus.y,
			viewScale: TOUR_OVERVIEW_SCALE,
			planeX: overviewFocus.x,
			planeY: overviewFocus.y,
			planeOpacity: 0,
			listOverlayOpacity: 0,
			tourActive: true,
			caseStudySitesRest: false
		};
		activeTourIndex = -1;

		if (firstTourSite) {
			await animateIntroZoom({
				fromFocus: overviewFocus,
				toSite: firstTourSite,
				duration: TOUR_INTRO_MS,
				overviewScale: TOUR_OVERVIEW_SCALE,
				siteScale: TOUR_SITE_SCALE,
				shouldContinue: () => id === sequenceId,
				onArrive: () => {
					activeTourIndex = 0;
				},
				onUpdate: ({ plane, planeRotation, focus, scale, planeOpacity }) => {
					frame = {
						...frame,
						viewFocusX: focus.x,
						viewFocusY: focus.y,
						viewScale: scale,
						planeX: plane.x,
						planeY: plane.y,
						planeRotation,
						planeOpacity,
						listOverlayOpacity: planeOpacity
					};
				}
			});
		}
		if (id !== sequenceId) return;

		frame = { ...frame, listOverlayOpacity: 1 };

		let loopSkipFly = false;

		while (id === sequenceId) {
			let skipArrivalFly = loopSkipFly;
			loopSkipFly = false;

			for (let i = 0; i < tourSites.length; i++) {
				const site = tourSites[i];

				if (i > 0) {
					if (!skipArrivalFly) {
						await flyBetween(id, tourSites[i - 1], site, i);
					}
					skipArrivalFly = false;
				}
				if (id !== sequenceId) return;

				activeTourIndex = i;
				await wait(TOUR_HOLD_MS);
				if (id !== sequenceId) return;

				if (i < tourSites.length - 1) {
					const next = tourSites[i + 1];
					await flyBetween(id, site, next, i + 1);
					skipArrivalFly = true;
				}

				if (id !== sequenceId) return;
			}

			const lastSite = tourSites[tourSites.length - 1];
			if (!firstTourSite || !lastSite || id !== sequenceId) return;

			await flyBetween(id, lastSite, firstTourSite, 0);
			loopSkipFly = true;
		}
	}

	async function transitionToCaseStudy() {
		const id = ++sequenceId;

		await animateProps({ opportunityDim: 0 }, FADE_MS);
		if (id !== sequenceId) return;

		frame = {
			...frame,
			caseStudySitesOpacity: 1,
			caseStudySitesEnterGen: frame.caseStudySitesEnterGen + 1,
			listOverlayOpacity: 0,
			caseStudySitesRest: false,
			viewFocusX: overviewFocus.x,
			viewFocusY: overviewFocus.y,
			viewScale: TOUR_OVERVIEW_SCALE,
			planeOpacity: 0,
			tourActive: false
		};
		activeTourIndex = -1;

		await wait(DOT_ENTER_MS);
		if (id !== sequenceId) return;

		await startCaseStudyTour(id);
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
			else if (id === 'public-agenda') showCaseStudyRest();
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
	let caseStudySitesAnimated = $derived(frame.caseStudySitesEnterGen > 0);
	let showMapSource = $derived(
		slideId === 'regional-opportunity' && frame.caseStudySitesOpacity < 0.01
	);
	let sourceOpacity = $derived(frame.opportunityDim);
	let isCaseStudyMap = $derived(slideId === 'public-agenda');
	let listOverlayOpacity = $derived(frame.listOverlayOpacity);
	let opportunityLayerOpacity = $derived(
		slideId === 'regional-opportunity' ? frame.opportunityDim : 0
	);
	let caseStudyLayerOpacity = $derived(
		slideId === 'public-agenda' ? frame.caseStudySitesOpacity : 0
	);
	let viewTransform = $derived.by(() => {
		const focus = {
			x: Number.isFinite(frame.viewFocusX) ? frame.viewFocusX : overviewFocus.x,
			y: Number.isFinite(frame.viewFocusY) ? frame.viewFocusY : overviewFocus.y
		};
		const scale = Number.isFinite(frame.viewScale) ? frame.viewScale : TOUR_OVERVIEW_SCALE;

		return viewTransformString(getViewTransform(focus, scale, mapSize));
	});
	let tourDotInverseScale = $derived(frame.tourActive ? 1 / frame.viewScale : 1);

	
	function isMutedState(stateId) {
		if (isCaseStudyMap) {
			return !caseStudyStateIds.includes(stateId);
		}

		return statesWithoutOpportunitySchools.has(stateId);
	}
</script>

<div class="us-map" class:map-case-study={isCaseStudyMap}>
	<div class="map-stage">
		<svg
		class="map-svg"
		viewBox="0 0 {mapSize.width} {mapSize.height}"
		preserveAspectRatio="xMidYMid meet"
		role="img"
		aria-label="United States map"
	>
		<g class="map-world" transform={viewTransform}>
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

			{#if slideId === 'regional-opportunity'}
			<g class="opportunity-layer" style:opacity={opportunityLayerOpacity}>
				{#each opportunitySites as site, i (site.key)}
					{@const delay = (i / Math.max(opportunitySites.length - 1, 1)) * OPPORTUNITY_SPREAD_MS}
					{@const showDot =
						frame.opportunityRest ||
						(opportunityAnimated && frame.opportunityEnterGen > 0)}
					<circle
						class="opportunity-dot"
						cx={site.x}
						cy={site.y}
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
			{/if}

			{#if slideId === 'public-agenda'}
			<g class="case-study-sites-layer" style:opacity={caseStudyLayerOpacity}>
				{#each caseStudySites as site (site.key)}
					{@const showSite =
						frame.caseStudySitesRest ||
						(caseStudySitesAnimated && frame.caseStudySitesEnterGen > 0)}
					{@const siteIndex = tourSites.findIndex((entry) => entry.key === site.key)}
					{@const isActive = siteIndex === activeTourIndex && activeTourIndex >= 0}
					<g class="case-study-site" class:is-active={isActive}>
						<g transform="translate({site.x}, {site.y})">
							<g transform="scale({tourDotInverseScale})">
								<circle
									class="case-study-dot"
									cx="0"
									cy="0"
									use:popDot={{
										animate: showSite && !frame.caseStudySitesRest && !frame.tourActive,
										visible: frame.caseStudySitesRest || frame.tourActive,
										gen: frame.caseStudySitesEnterGen,
										delay: 0,
										duration: DOT_ENTER_MS,
										r: CASE_STUDY_DOT_R
									}}
								/>
								<circle
									class="case-study-ring"
									cx="0"
									cy="0"
									fill="none"
									use:popDot={{
										animate: showSite && !frame.caseStudySitesRest && !frame.tourActive,
										visible: frame.caseStudySitesRest || frame.tourActive,
										gen: frame.caseStudySitesEnterGen,
										delay: 0,
										duration: DOT_ENTER_MS,
										r: CASE_STUDY_RING_R
									}}
								/>
							</g>
						</g>
					</g>
				{/each}
			</g>
			{/if}

			{#if slideId === 'public-agenda' && frame.planeOpacity > 0.01}
				<g
					class="tour-plane"
					transform="translate({frame.planeX}, {frame.planeY}) rotate({frame.planeRotation})"
					opacity={frame.planeOpacity}
				>
					<g transform="scale({tourDotInverseScale})">
						<path class="plane-body" d="M -11 0 L -3 -4.5 L 8 0 L -3 4.5 Z" />
						<path class="plane-wing" d="M -4 -7 L 1 -7 L 1 7 L -4 7 Z" />
					</g>
				</g>
			{/if}
		</g>
	</svg>
	</div>

	{#if isCaseStudyMap}
		<div class="case-study-overlay" style:opacity={listOverlayOpacity} aria-hidden={listOverlayOpacity < 0.01}>
			<div class="case-study-gradient" aria-hidden="true"></div>
			<CaseStudyInstitutionList names={tourInstitutionNames} activeIndex={activeTourIndex} />
		</div>
	{/if}

	{#if showMapSource}
		<p class="chart-source" style:opacity={sourceOpacity}>{SOURCE}</p>
	{/if}
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
		--map-active-fill: var(--map-state-fill-teal);
		--map-active-stroke: var(--map-state-stroke-teal);
		--map-dot-color: var(--color-teal);
	}

	.map-stage {
		position: relative;
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
	}

	.map-case-study .case-study-overlay {
		position: absolute;
		inset: 0;
		z-index: 3;
		pointer-events: none;
	}

	.map-case-study .case-study-gradient {
		position: absolute;
		inset: 0;
		z-index: 2;
		pointer-events: none;
		background: linear-gradient(
			to right,
			color-mix(in srgb, var(--color-teal, #318793) 62%, transparent) 0%,
			color-mix(in srgb, var(--color-teal, #318793) 28%, transparent) 32%,
			transparent 58%
		);
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
		fill: var(--map-active-fill);
		stroke: var(--map-active-stroke);
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
		fill: var(--map-dot-color);
		stroke: var(--color-white);
		stroke-width: 1.5;
		paint-order: stroke fill;
	}

	.map-svg :global(.case-study-ring) {
		stroke: var(--color-teal);
		stroke-width: 2;
		paint-order: stroke fill;
	}

	.map-svg :global(.case-study-dot) {
		fill: var(--color-teal);
		stroke: var(--color-white);
		stroke-width: 1.5;
		paint-order: stroke fill;
		transition: r 250ms ease;
	}

	.map-svg :global(.case-study-site.is-active .case-study-dot) {
		fill: var(--color-teal-dark);
	}

	.map-svg :global(.case-study-site.is-active .case-study-ring) {
		stroke: var(--color-teal-dark);
		stroke-width: 2.5;
	}

	.map-svg :global(.plane-body) {
		fill: var(--color-teal);
		stroke: var(--color-white);
		stroke-width: 1.2;
		paint-order: stroke fill;
	}

	.map-svg :global(.plane-wing) {
		fill: var(--color-teal-dark);
		opacity: 0.85;
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
		padding: 0 1.25rem 1rem;
		transition: opacity 0.15s linear;
	}
</style>
