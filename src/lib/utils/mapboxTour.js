import { buildTourOrder, isSameRegion } from '$lib/utils/mapFlythrough.js';
import { easeInOutCubic, lerp } from '$lib/utils/ease.js';

export const CASE_STUDY_FOCUS_X = 0.8;

const TOUR_FLY_LOCAL_MS = 650;
const TOUR_FLY_REGION_MS = 900;
const TOUR_HOLD_MS = 500;
const TOUR_INTRO_MS = 1600;
const TOUR_PRE_DELAY = 600;
const SITE_ZOOM = 7;
// Regional flyTo arc: enough lift for long legs without the label-flicker dip of ~1.55.
const FLY_CURVE_REGIONAL = 1.32;

const LOWER_48_BOUNDS = [-125.288086, 26.39187, -67.192383, 49.496675];
const US_CENTER = [-96, 38.5];

function asPoint(site) {
	return { x: site.lon, y: site.lat, state: site.state, key: site.key, id: site.id };
}

export function getCaseStudyTourSites(sites) {
	return buildTourOrder(sites.map(asPoint)).map((site) => {
		const match = sites.find((entry) => entry.key === site.key);
		return match ?? { lon: site.x, lat: site.y, id: site.id, key: site.key, state: site.state };
	});
}

export function getCaseStudyTourNames(sites) {
	return getCaseStudyTourSites(sites).map((site) => site.id ?? '');
}

export function getLower48Camera(map) {
	const camera = map.cameraForBounds(
		[
			[LOWER_48_BOUNDS[0], LOWER_48_BOUNDS[1]],
			[LOWER_48_BOUNDS[2], LOWER_48_BOUNDS[3]]
		],
		{ padding: 0 }
	);

	const center = camera.center;
	const lng =
		center && typeof center === 'object' && 'lng' in center
			? center.lng
			: Array.isArray(center)
				? center[0]
				: US_CENTER[0];
	const lat =
		center && typeof center === 'object' && 'lat' in center
			? center.lat
			: Array.isArray(center)
				? center[1]
				: US_CENTER[1];

	return {
		center: [lng, lat],
		zoom: Number.isFinite(camera.zoom) ? camera.zoom : 3.9
	};
}

// CSS rotation in degrees for travel direction: 0 = due east, clockwise
// positive (screen y points down). Longitude is scaled by cos(lat) so
// headings don't skew toward vertical at northern latitudes.
function headingDegrees(from, to) {
	const midLat = (((from.lat + to.lat) / 2) * Math.PI) / 180;
	const dx = (to.lon - from.lon) * Math.cos(midLat);
	const dy = to.lat - from.lat;
	return (Math.atan2(-dy, dx) * 180) / Math.PI;
}

export function getCaseStudyFocusPadding(map, progress = 1) {
	const width = map.getContainer()?.clientWidth ?? 0;
	if (!width || progress <= 0) return { top: 0, bottom: 0, left: 0, right: 0 };

	const targetLeft = (2 * CASE_STUDY_FOCUS_X - 1) * width;
	return { top: 0, bottom: 0, left: targetLeft * progress, right: 0 };
}

function moveCamera(map, point, zoom, focusProgress = 1) {
	if (!Number.isFinite(point.lon) || !Number.isFinite(point.lat) || !Number.isFinite(zoom)) {
		return;
	}

	map.jumpTo({
		center: [point.lon, point.lat],
		zoom,
		padding: getCaseStudyFocusPadding(map, focusProgress)
	});
}

// easeTo for short same-state hops; flyTo with a moderate curve for cross-region legs.
// flyTo dips zoom mid-flight — too aggressive a curve makes basemap labels blink.
function flyCamera(map, {
	point,
	zoom,
	duration,
	padding,
	arc = false,
	curve = FLY_CURVE_REGIONAL,
	shouldContinue,
	onProgress
}) {
	return new Promise((resolve) => {
		let raf = 0;
		let settled = false;

		const finish = () => {
			if (settled) return;
			settled = true;
			cancelAnimationFrame(raf);
			map.off('moveend', finish);
			resolve(undefined);
		};

		const start = performance.now();

		const tick = (now) => {
			if (settled) return;

			if (!shouldContinue()) {
				map.stop();
				finish();
				return;
			}

			const progress = Math.min(1, (now - start) / duration);
			onProgress?.(progress);

			if (progress < 1) {
				raf = requestAnimationFrame(tick);
			} else {
				setTimeout(finish, 150);
			}
		};

		map.once('moveend', finish);

		const camera = {
			center: [point.lon, point.lat],
			zoom,
			duration,
			padding,
			essential: true
		};

		if (arc) {
			map.flyTo({ ...camera, curve });
		} else {
			map.easeTo(camera);
		}

		raf = requestAnimationFrame(tick);
	});
}

export function getTourLegDuration(from, to) {
	return isSameRegion(asPoint(from), asPoint(to)) ? TOUR_FLY_LOCAL_MS : TOUR_FLY_REGION_MS;
}

export function usesFlightArc(from, to) {
	return !isSameRegion(asPoint(from), asPoint(to));
}

export async function runCaseStudyTour({
	map,
	sites,
	shouldContinue,
	onActiveIndex,
	onIntroUpdate,
	onPlaneUpdate
}) {
	const overview = getLower48Camera(map);
	const tourSites = getCaseStudyTourSites(sites);

	const firstSite = tourSites[0];
	if (!firstSite) return;

	const overviewFocus = { lon: overview.center[0], lat: overview.center[1] };

	// Preset the rotation while hidden so the plane doesn't visibly spin into
	// its first heading when it fades in at the first site.
	onPlaneUpdate?.({ rotation: headingDegrees(overviewFocus, firstSite), visible: false });
	onActiveIndex(-1);
	moveCamera(map, overviewFocus, overview.zoom, 0);

	await wait(TOUR_PRE_DELAY, shouldContinue);
	if (!shouldContinue()) return;

	// flyTo animates padding from its current value (0, set above) to the full
	// case-study offset, so the focus shift rides along with the intro zoom.
	let introArrived = false;
	await flyCamera(map, {
		point: firstSite,
		zoom: SITE_ZOOM,
		duration: TOUR_INTRO_MS,
		padding: getCaseStudyFocusPadding(map, 1),
		shouldContinue,
		onProgress: (progress) => {
			if (!introArrived && progress >= 0.7) {
				introArrived = true;
				onActiveIndex(0);
			}
			onIntroUpdate?.({
				planeOpacity: Math.min(1, progress * 1.4),
				focusProgress: easeInOutCubic(progress)
			});
		}
	});
	if (!shouldContinue()) return;
	if (!introArrived) onActiveIndex(0);

	onPlaneUpdate?.({ visible: true });

	let loopSkipFly = false;

	while (shouldContinue()) {
		let skipArrivalFly = loopSkipFly;
		loopSkipFly = false;

		for (let i = 0; i < tourSites.length; i++) {
			const site = tourSites[i];

			if (i > 0) {
				if (!skipArrivalFly) {
					await flyBetween(map, tourSites[i - 1], site, shouldContinue, onActiveIndex, onPlaneUpdate, i);
				}
				skipArrivalFly = false;
			}
			if (!shouldContinue()) return;

			onActiveIndex(i);
			await wait(TOUR_HOLD_MS, shouldContinue);
			if (!shouldContinue()) return;

			if (i < tourSites.length - 1) {
				const next = tourSites[i + 1];
				await flyBetween(map, site, next, shouldContinue, onActiveIndex, onPlaneUpdate, i + 1);
				skipArrivalFly = true;
			}
		}

		const lastSite = tourSites[tourSites.length - 1];
		if (!firstSite || !lastSite) return;

		await flyBetween(map, lastSite, firstSite, shouldContinue, onActiveIndex, onPlaneUpdate, 0);
		loopSkipFly = true;
	}
}

async function flyBetween(
	map,
	from,
	to,
	shouldContinue,
	onActiveIndex,
	onPlaneUpdate,
	arrivalIndex
) {
	const duration = getTourLegDuration(from, to);

	onPlaneUpdate?.({ rotation: headingDegrees(from, to), visible: true });
	onActiveIndex(arrivalIndex);

	await flyCamera(map, {
		point: to,
		zoom: SITE_ZOOM,
		duration,
		padding: getCaseStudyFocusPadding(map, 1),
		arc: usesFlightArc(from, to),
		shouldContinue
	});
}

export function animateCameraTo(
	map,
	point,
	zoom,
	duration,
	shouldContinue,
	{ startFocus = 0, endFocus = 0, onFocusUpdate } = {}
) {
	return flyCamera(map, {
		point,
		zoom,
		duration,
		padding: getCaseStudyFocusPadding(map, endFocus),
		shouldContinue,
		onProgress: (progress) => {
			onFocusUpdate?.(lerp(startFocus, endFocus, easeInOutCubic(progress)));
		}
	});
}

function wait(ms, shouldContinue) {
	return new Promise((resolve) => {
		setTimeout(() => resolve(shouldContinue()), ms);
	});
}

export { SITE_ZOOM, US_CENTER, LOWER_48_BOUNDS };
