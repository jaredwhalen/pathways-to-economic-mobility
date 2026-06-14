

const MONO = {
	background: '#f5f5f5',
	land: '#ececec',
	water: '#e4e4e4',
	border: '#d4d4d4',
	stateLine: '#cfcfcf',
	fillActive: '#eef4f5',
	fillMuted: '#f4f1f1',
	fillStrokeActive: '#c5d9dc',
	fillStrokeMuted: '#d0d0d0',
	teal: '#318793',
	tealDark: '#19444a'
};

export function applyLightMonoStyle(map) {
	map.setFog({
		color: MONO.background,
		'high-color': MONO.background,
		'horizon-blend': 0.04,
		'space-color': MONO.background,
		'star-intensity': 0
	});

	const style = map.getStyle();
	if (!style?.layers) return;

	for (const layer of style.layers) {
		if (layer.type === 'symbol') {
			map.setLayoutProperty(layer.id, 'visibility', 'none');
		}
	}

	const fillLayers = [
		'land',
		'landcover',
		'national-park',
		'landuse',
		'water',
		'water-shadow',
		'waterway'
	];

	for (const id of fillLayers) {
		if (!map.getLayer(id)) continue;
		const layer = style.layers.find((entry) => entry.id === id);
		if (!layer) continue;

		if (layer.type === 'fill') {
			map.setPaintProperty(
				id,
				'fill-color',
				id.includes('water') ? MONO.water : MONO.land
			);
		} else if (layer.type === 'background') {
			map.setPaintProperty(id, 'background-color', MONO.land);
		}
	}

	for (const id of ['admin-0-boundary', 'admin-1-boundary']) {
		if (!map.getLayer(id)) continue;
		map.setPaintProperty(id, 'line-color', MONO.border);
		map.setPaintProperty(id, 'line-opacity', 0.35);
	}
}

export function addStateLayers(map, statesGeo) {
	if (map.getSource('us-states')) return;

	map.addSource('us-states', {
		type: 'geojson',
		data: statesGeo
	});

	map.addLayer({
		id: 'us-states-fill',
		type: 'fill',
		source: 'us-states',
		paint: {
			'fill-color': [
				'match',
				['get', 'fillTier'],
				'active',
				MONO.fillActive,
				MONO.fillMuted
			],
			'fill-opacity': 1
		}
	});

	map.addLayer({
		id: 'us-states-line',
		type: 'line',
		source: 'us-states',
		paint: {
			'line-color': [
				'match',
				['get', 'fillTier'],
				'active',
				MONO.fillStrokeActive,
				MONO.fillStrokeMuted
			],
			'line-width': 1
		}
	});
}

// Disable Mapbox's built-in 300ms paint transitions: opacity/radius are driven
// per-frame from rAF animations, and the implicit transition both lags behind
// and causes dots to flash at full opacity before the first explicit set.
const ZERO_TRANSITION = { duration: 0, delay: 0 };

const GLOBE_CIRCLE_PAINT = {
	'circle-pitch-alignment': 'map',
	'circle-pitch-scale': 'map'
};

const CUSTOM_GEOJSON_SOURCES = new Set(['opportunity-sites', 'case-study-sites']);

export function stabilizeGlobeFlightLayers(map) {
	map.setTerrain(null);

	const style = map.getStyle();
	if (!style?.layers) return;

	for (const layer of style.layers) {
		if (layer.source && CUSTOM_GEOJSON_SOURCES.has(layer.source)) continue;

		try {
			map.setLayerZoomRange(layer.id, 0, 24);
		} catch {
			// Some layers do not support zoom-range changes.
		}
	}
}

export function addSiteLayer(map, sourceId, geojson, options = {}) {
	const { circleColor = MONO.teal } = options;

	if (map.getSource(sourceId)) {
		map.getSource(sourceId).setData(geojson);
		return;
	}

	map.addSource(sourceId, {
		type: 'geojson',
		data: geojson
	});

	map.addLayer({
		id: `${sourceId}-circle`,
		type: 'circle',
		source: sourceId,
		paint: {
			'circle-color': circleColor,
			'circle-radius': 0,
			'circle-opacity': 0,
			'circle-stroke-color': '#ffffff',
			'circle-stroke-width': 0,
			'circle-stroke-opacity': 0,
			...GLOBE_CIRCLE_PAINT,
			'circle-opacity-transition': ZERO_TRANSITION,
			'circle-radius-transition': ZERO_TRANSITION,
			'circle-stroke-width-transition': ZERO_TRANSITION,
			'circle-stroke-opacity-transition': ZERO_TRANSITION
		}
	});
}

// Portion of the overall entrance timeline each individual dot animates over.
// Smaller values = more pronounced one-by-one stagger.
const ENTER_WINDOW = 0.35;

function radiusFromEnterLocal(local, circleRadius) {
	if (local <= 0) return 0;
	if (local >= 1) return circleRadius;
	if (local <= 0.75) return (local / 0.75) * circleRadius * 1.3;
	return circleRadius * 1.3 + ((local - 0.75) / 0.25) * (circleRadius - circleRadius * 1.3);
}

export function setSiteLayerEnterProgress(map, layerId, progress, options = {}) {
	const { circleRadius = 5, circleStrokeWidth = 2, staggered = true } = options;
	if (!map.getLayer(layerId)) return;

	const p = Math.min(1, Math.max(0, progress));

	if (p === 0) {
		map.setPaintProperty(layerId, 'circle-opacity', 0);
		map.setPaintProperty(layerId, 'circle-stroke-opacity', 0);
		map.setPaintProperty(layerId, 'circle-radius', 0);
		map.setPaintProperty(layerId, 'circle-stroke-width', 0);
		return;
	}

	if (p === 1) {
		map.setPaintProperty(layerId, 'circle-opacity', 1);
		map.setPaintProperty(layerId, 'circle-stroke-opacity', 1);
		map.setPaintProperty(layerId, 'circle-radius', circleRadius);
		map.setPaintProperty(layerId, 'circle-stroke-width', circleStrokeWidth);
		return;
	}

	if (!staggered) {
		const local = Math.min(1, Math.max(0, p / ENTER_WINDOW));
		map.setPaintProperty(layerId, 'circle-opacity', local);
		map.setPaintProperty(layerId, 'circle-stroke-opacity', local);
		map.setPaintProperty(layerId, 'circle-radius', radiusFromEnterLocal(local, circleRadius));
		map.setPaintProperty(layerId, 'circle-stroke-width', local * circleStrokeWidth);
		return;
	}

	
	const local = [
		'min',
		1,
		['max', 0, ['/', ['-', p, ['*', ['get', 'stagger'], 1 - ENTER_WINDOW]], ENTER_WINDOW]]
	];

	map.setPaintProperty(layerId, 'circle-opacity', local);
	map.setPaintProperty(layerId, 'circle-stroke-opacity', local);
	map.setPaintProperty(layerId, 'circle-radius', [
		'interpolate',
		['linear'],
		local,
		0,
		0,
		0.75,
		circleRadius * 1.3,
		1,
		circleRadius
	]);
	map.setPaintProperty(layerId, 'circle-stroke-width', [
		'interpolate',
		['linear'],
		local,
		0,
		0,
		1,
		circleStrokeWidth
	]);
}

export function setSiteLayerFade(map, layerId, opacity, options = {}) {
	const { circleRadius = 5, circleStrokeWidth = 2 } = options;
	if (!map.getLayer(layerId)) return;

	const o = Math.min(1, Math.max(0, opacity));
	map.setPaintProperty(layerId, 'circle-opacity', o);
	map.setPaintProperty(layerId, 'circle-stroke-opacity', o);
	map.setPaintProperty(layerId, 'circle-radius', circleRadius);
	map.setPaintProperty(layerId, 'circle-stroke-width', circleStrokeWidth);
}

export function addCaseStudySiteLayer(map, sourceId, geojson) {
	if (map.getSource(sourceId)) {
		map.getSource(sourceId).setData(geojson);
		return;
	}

	map.addSource(sourceId, {
		type: 'geojson',
		data: geojson
	});

	map.addLayer({
		id: `${sourceId}-ring`,
		type: 'circle',
		source: sourceId,
		paint: {
			'circle-color': 'transparent',
			'circle-radius': 0,
			'circle-stroke-color': MONO.teal,
			'circle-stroke-width': 0,
			'circle-opacity': 0,
			'circle-stroke-opacity': 0,
			...GLOBE_CIRCLE_PAINT,
			'circle-opacity-transition': ZERO_TRANSITION,
			'circle-radius-transition': ZERO_TRANSITION,
			'circle-stroke-width-transition': ZERO_TRANSITION,
			'circle-stroke-opacity-transition': ZERO_TRANSITION
		}
	});

	map.addLayer({
		id: `${sourceId}-dot`,
		type: 'circle',
		source: sourceId,
		paint: {
			'circle-color': MONO.teal,
			'circle-radius': 0,
			'circle-stroke-color': '#ffffff',
			'circle-stroke-width': 0,
			'circle-opacity': 0,
			'circle-stroke-opacity': 0,
			...GLOBE_CIRCLE_PAINT,
			'circle-opacity-transition': ZERO_TRANSITION,
			'circle-radius-transition': ZERO_TRANSITION,
			'circle-stroke-width-transition': ZERO_TRANSITION,
			'circle-stroke-opacity-transition': ZERO_TRANSITION
		}
	});
}

export { MONO };
