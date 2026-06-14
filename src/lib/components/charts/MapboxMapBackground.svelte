<script>
	import mapboxgl from "mapbox-gl";
	import "mapbox-gl/dist/mapbox-gl.css";
	import { getMapboxToken, MAPBOX_STYLE } from "$lib/config/mapbox.js";
	import { getSlideIndex } from "$lib/data/copy.js";
	import { easeInOutCubic, lerp } from "$lib/utils/ease.js";
	import {
		addSiteLayer,
		addCaseStudySiteLayer,
		setSiteLayerEnterProgress,
		setSiteLayerFade,
		stabilizeGlobeFlightLayers,
		MONO,
	} from "$lib/utils/mapboxStyle.js";
	import {
		opportunitySitesGeo,
		caseStudySitesGeo,
		sitesToFeatureCollection,
	} from "$lib/utils/mapboxGeo.js";
	import CaseStudyInstitutionList from "$lib/components/charts/CaseStudyInstitutionList.svelte";
	import {
		runCaseStudyTour,
		getLower48Camera,
		getCaseStudyTourNames,
		getCaseStudyFocusPadding,
		animateCameraTo,
		CASE_STUDY_FOCUS_X,
	} from "$lib/utils/mapboxTour.js";

	
	let { slideId = "regional-opportunity" } = $props();

	
	function attachMapContainer(node) {
		const instance = initMap(node);

		return {
			destroy() {
				cancelAnimationFrame(rafId);
				sequenceId++;
				instance.remove();
				map = null;
				mapReady = false;
			},
		};
	}

	const FADE_MS = 280;
	const ZOOM_OUT_MS = 450;
	const ENTER_DELAY_MS = 400;
	const DOT_ENTER_MS = 450;
	const OPPORTUNITY_SPREAD_MS = 1400;
	const OPPORTUNITY_DOT = {
		circleColor: MONO.teal,
		circleRadius: 3.5,
		circleStrokeWidth: 1.5,
	};
	const SOURCE = "Source: CCIHE Opportunity College and Universities";

	

	let frame = $state({
		opportunityDim: 0,
		caseStudySitesOpacity: 0,
		listOverlayOpacity: 0,
		opportunityRest: false,
		caseStudySitesRest: false,
		tourActive: false,
	});

	let sequenceId = 0;
	let rafId = 0;
	let prevSlideId = "";
	// True only during the staggered first entrance of the opportunity dots;
	// every other opacity change is a plain uniform fade.
	let opportunityEntering = false;
	let activeTourIndex = $state(-1);
	let planeRotation = $state(0);

	// Accumulate rotation via the shortest arc so the CSS transition never
	// spins the long way around (e.g. 170deg -> -170deg).
	function setPlaneRotation(target) {
		const delta = ((((target - planeRotation) % 360) + 540) % 360) - 180;
		planeRotation += delta;
	}
	let planeVisible = $state(false);
	let focusProgress = $state(0);

	let focusXPercent = $derived(
		50 + (CASE_STUDY_FOCUS_X - 0.5) * 100 * focusProgress
	);

	
	let map = null;
	let mapReady = $state(false);

	const tourInstitutionNames = getCaseStudyTourNames(caseStudySitesGeo);

	
	function animateProps(target, duration) {
		return new Promise((resolve) => {
			const from = { ...frame };
			const keys = Object.keys(target);
			const start = performance.now();

			cancelAnimationFrame(rafId);

			const tick = (now) => {
				const t = Math.min(1, (now - start) / duration);
				const e = easeInOutCubic(t);
				const next = { ...frame };

				for (const key of keys) {
					const a = from[key];
					const b = target[key];
					if (typeof a === "number" && typeof b === "number") {
						next[key] = lerp(a, b, e);
					}
				}

				frame = next;
				syncLayerOpacity();

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

	function syncLayerOpacity() {
		// Don't gate on isStyleLoaded(): it reports false while tiles load after
		// camera jumps, which silently dropped these updates and left stale
		// dot opacity painted on re-entry.
		if (!map || !mapReady) return;

		// Visibility follows the animated opacities (not slideId) so the two dot
		// sets can crossfade while a slide transition is in flight.
		const onMapSlide =
			slideId === "regional-opportunity" || slideId === "public-agenda";
		const oppOpacity = onMapSlide
			? Math.min(1, Math.max(0, frame.opportunityDim))
			: 0;
		const caseOpacity = onMapSlide
			? Math.min(1, Math.max(0, frame.caseStudySitesOpacity))
			: 0;

		for (const id of ["opportunity-sites-circle"]) {
			if (!map.getLayer(id)) continue;
			map.setLayoutProperty(id, "visibility", "visible");
			if (opportunityEntering)
				setSiteLayerEnterProgress(map, id, oppOpacity, OPPORTUNITY_DOT);
			else setSiteLayerFade(map, id, oppOpacity, OPPORTUNITY_DOT);
		}
		for (const id of ["case-study-sites-ring", "case-study-sites-dot"]) {
			if (!map.getLayer(id)) continue;
			map.setLayoutProperty(id, "visibility", "visible");
			setSiteLayerFade(
				map,
				id,
				caseOpacity,
				id === "case-study-sites-dot"
					? { circleRadius: 4.5, circleStrokeWidth: 1.5 }
					: { circleRadius: 8, circleStrokeWidth: 2 },
			);
		}

		if (slideId !== "public-agenda") hidePlane();
	}

	
	function applyGlobeFog(instance) {
		instance.setFog({
			color: MONO.background,
			"high-color": MONO.background,
			"horizon-blend": 0.04,
			"space-color": MONO.background,
			"star-intensity": 0,
		});
	}

	
	function initMap(container) {
		mapboxgl.accessToken = getMapboxToken();

		const instance = new mapboxgl.Map({
			container,
			style: MAPBOX_STYLE,
			projection: "globe",
			center: [-96, 38.5],
			zoom: 3.9,
			attributionControl: false,
			logoPosition: "bottom-right",
			interactive: false,
			fadeDuration: 0,
		});

		instance.on("style.load", () => {
			applyGlobeFog(instance);
			stabilizeGlobeFlightLayers(instance);
			addSiteLayer(
				instance,
				"opportunity-sites",
				sitesToFeatureCollection(opportunitySitesGeo),
				OPPORTUNITY_DOT,
			);
			addCaseStudySiteLayer(
				instance,
				"case-study-sites",
				sitesToFeatureCollection(caseStudySitesGeo),
			);

			resetMap1Camera(instance);

			map = instance;
			mapReady = true;
			syncLayerOpacity();
		});

		return instance;
	}

	async function enterOpportunity() {
		const id = ++sequenceId;

		opportunityEntering = true;
		frame = {
			opportunityDim: 0,
			caseStudySitesOpacity: 0,
			listOverlayOpacity: 0,
			opportunityRest: false,
			caseStudySitesRest: false,
			tourActive: false,
		};
		syncLayerOpacity();
		resetMap1Camera();
		hidePlane();

		await wait(ENTER_DELAY_MS);
		if (id !== sequenceId) return;

		await animateProps(
			{ opportunityDim: 1 },
			OPPORTUNITY_SPREAD_MS + DOT_ENTER_MS,
		);
		if (id !== sequenceId) return;
		opportunityEntering = false;
	}

	function showOpportunityRest() {
		sequenceId++;
		cancelAnimationFrame(rafId);
		opportunityEntering = false;
		frame = {
			opportunityDim: 1,
			caseStudySitesOpacity: 0,
			listOverlayOpacity: 0,
			opportunityRest: true,
			caseStudySitesRest: false,
			tourActive: false,
		};
		syncLayerOpacity();
		resetMap1Camera();
		hidePlane();
	}

	async function transitionFromCaseStudy() {
		stopTour();
		const id = ++sequenceId;
		opportunityEntering = false;

		if (map) {
			const overview = getLower48Camera(map);
			await animateCameraTo(
				map,
				{ lon: overview.center[0], lat: overview.center[1] },
				overview.zoom,
				ZOOM_OUT_MS,
				() => id === sequenceId,
				{
					startFocus: focusProgress,
					endFocus: 0,
					onFocusUpdate: (progress) => {
						focusProgress = progress;
					},
				},
			);
		}
		if (id !== sequenceId) return;

		await animateProps(
			{
				opportunityDim: 1,
				caseStudySitesOpacity: 0,
				listOverlayOpacity: 0,
			},
			FADE_MS,
		);
		if (id !== sequenceId) return;

		frame = {
			...frame,
			opportunityRest: true,
			caseStudySitesRest: false,
			tourActive: false,
		};
		syncLayerOpacity();
		hidePlane();
	}

	function showCaseStudyRest() {
		sequenceId++;
		cancelAnimationFrame(rafId);
		stopTour();
		opportunityEntering = false;
		frame = {
			opportunityDim: 0,
			caseStudySitesOpacity: 1,
			listOverlayOpacity: 1,
			opportunityRest: false,
			caseStudySitesRest: true,
			tourActive: false,
		};
		syncLayerOpacity();
		resetCamera(map, true);
		hidePlane();
	}

	function resetCamera(target = map ?? undefined, useCaseStudyFocus = false) {
		if (!target) return;
		target.resize();
		const overview = getLower48Camera(target);
		const progress = useCaseStudyFocus ? 1 : 0;
		target.jumpTo({
			center: overview.center,
			zoom: overview.zoom,
			padding: getCaseStudyFocusPadding(target, progress),
		});
		if (target === map) focusProgress = progress;
	}

	function resetMap1Camera(target = map ?? undefined) {
		resetCamera(target, false);
	}

	function hidePlane() {
		activeTourIndex = -1;
		planeVisible = false;
	}

	function stopTour() {
		sequenceId++;
		hidePlane();
	}

	async function transitionToCaseStudy() {
		const id = ++sequenceId;
		opportunityEntering = false;

		// Crossfade both dot sets at the same time.
		await animateProps(
			{ opportunityDim: 0, caseStudySitesOpacity: 1 },
			FADE_MS,
		);
		if (id !== sequenceId) return;

		frame = {
			...frame,
			listOverlayOpacity: 0,
			caseStudySitesRest: false,
			tourActive: false,
		};
		syncLayerOpacity();

		await startCaseStudyTour(id);
	}

	
	async function startCaseStudyTour(id) {
		if (!map) return;

		if (typeof window !== "undefined") {
			const reducedMotion = window.matchMedia(
				"(prefers-reduced-motion: reduce)",
			).matches;
			if (reducedMotion) {
				showCaseStudyRest();
				return;
			}
		}

		frame = {
			...frame,
			tourActive: true,
			caseStudySitesRest: false,
			listOverlayOpacity: 0,
		};
		activeTourIndex = -1;
		planeVisible = false;
		focusProgress = 0;
		map.resize();
		resetMap1Camera(map);

		const shouldContinue = () => id === sequenceId;

		await runCaseStudyTour({
			map,
			sites: caseStudySitesGeo,
			shouldContinue,
			onActiveIndex: (index) => {
				activeTourIndex = index;
			},
			onIntroUpdate: ({ planeOpacity, focusProgress: progress }) => {
				frame = { ...frame, listOverlayOpacity: planeOpacity };
				if (progress !== undefined) focusProgress = progress;
			},
			onPlaneUpdate: ({ rotation, visible }) => {
				if (rotation !== undefined) {
					// While hidden, preset the angle directly so the plane never
					// animates into its first heading on fade-in.
					if (planeVisible) setPlaneRotation(rotation);
					else planeRotation = rotation;
				}
				if (visible !== undefined) planeVisible = visible;
			},
		});

		if (id === sequenceId) {
			frame = { ...frame, listOverlayOpacity: 1 };
		}
	}

	$effect(() => {
		slideId;
		syncLayerOpacity();
	});

	$effect(() => {
		const id = slideId;
		if (!mapReady) return;
		if (id === prevSlideId) return;

		const prevIndex = getSlideIndex(prevSlideId);
		const currentIndex = getSlideIndex(id);
		const direction = currentIndex > prevIndex ? "down" : "up";
		const opportunityIndex = getSlideIndex("regional-opportunity");
		const caseStudyIndex = getSlideIndex("public-agenda");

		if (direction === "down") {
			if (id === "regional-opportunity" && prevIndex < opportunityIndex)
				enterOpportunity();
			else if (id === "public-agenda" && prevIndex < caseStudyIndex)
				transitionToCaseStudy();
			else if (id === "public-agenda") showCaseStudyRest();
		} else if (direction === "up") {
			if (
				id === "regional-opportunity" &&
				prevSlideId === "public-agenda"
			)
				transitionFromCaseStudy();
			else if (id === "regional-opportunity") showOpportunityRest();
		}

		prevSlideId = id;
	});

	$effect(() => {
		return () => {
			cancelAnimationFrame(rafId);
			sequenceId++;
		};
	});

	let showMapSource = $derived(
		frame.caseStudySitesOpacity < 0.01 &&
			slideId === "regional-opportunity",
	);
	let sourceOpacity = $derived(frame.opportunityDim);
	let isCaseStudyMap = $derived(slideId === "public-agenda");
	let listOverlayOpacity = $derived(frame.listOverlayOpacity);
</script>

<div class="us-map mapbox-map" class:map-case-study={isCaseStudyMap}>
	<div class="map-stage">
		<div
			class="mapbox-container"
			use:attachMapContainer
			role="img"
			aria-label="United States map"
		></div>
	</div>

	{#if isCaseStudyMap}
		<div
			class="tour-plane"
			class:is-visible={planeVisible}
			style:left="{focusXPercent}%"
			aria-hidden="true"
		>
			<svg
				viewBox="0 0 1200 1200"
				style:transform="rotate({planeRotation}deg)"
				aria-hidden="true"
			>
				<path
					d="M321,1164h120l269.28-480.06H1020c0,0,180,0,180-83.94c0-84-180-84-180-84H710.28L441,36H321l149.28,480H255.06L120,395.94H0l96.06,204L0,804h120l135.06-120.06h215.22L321,1164z"
				/>
			</svg>
		</div>

		<div
			class="case-study-overlay"
			style:opacity={listOverlayOpacity}
			aria-hidden={listOverlayOpacity < 0.01}
		>
			<div class="case-study-gradient" aria-hidden="true"></div>
			<CaseStudyInstitutionList
				names={tourInstitutionNames}
				activeIndex={activeTourIndex}
			/>
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
		background: #f5f5f5;
		overflow: hidden;
	}

	.map-stage {
		position: relative;
		width: 100%;
		height: 100%;
		overflow: hidden;
	}

	.mapbox-container {
		width: 100%;
		height: 100%;
	}

	.tour-plane {
		--plane-size: 40px;
		position: absolute;
		top: 50%;
		z-index: 4;
		margin: calc(var(--plane-size) / -2) 0 0 calc(var(--plane-size) / -2);
		opacity: 0;
		pointer-events: none;
		transition: opacity 200ms ease-out;
	}

	.tour-plane.is-visible {
		opacity: 1;
	}

	.tour-plane svg {
		display: block;
		width: var(--plane-size);
		height: var(--plane-size);
		overflow: visible;
		filter: drop-shadow(0 0 1px #fff) drop-shadow(0 0 2px #fff);
		transition: transform 500ms ease;
		will-change: transform;
	}

	.tour-plane {
		fill: var(--color-teal-dark, #19444a);
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
			color-mix(in srgb, var(--color-teal-dark, #143135) 62%, transparent) 0%,
			color-mix(in srgb, var(--color-teal, #318793) 28%, transparent) 52%,
			transparent 100%
		);
		/* background-image: linear-gradient(
			305deg,
			rgba(25, 68, 74, 0.55) 0%,
			rgba(25, 68, 74, 0.82) 45%,
			rgba(3, 31, 67, 0.92) 100%
		);
		opacity: 0.6; */
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
