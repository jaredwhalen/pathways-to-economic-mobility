import { geoAlbersUsa, geoPath } from 'd3-geo';

export const MAP = {
	width: 975,
	height: 610,
	padding: 12
};

/**
 * @param {import('geojson').FeatureCollection} geojson
 * @param {number} [width]
 * @param {number} [height]
 */
export function buildMapLayout(geojson, width = MAP.width, height = MAP.height) {
	const features = geojson.features.filter(
		(f) => f.properties?.STATE !== '72' && f.id !== '72'
	);
	const collection = /** @type {import('geojson').FeatureCollection} */ ({
		type: 'FeatureCollection',
		features
	});

	const innerW = width - MAP.padding * 2;
	const innerH = height - MAP.padding * 2;
	const projection = geoAlbersUsa().fitExtent(
		[
			[MAP.padding, MAP.padding],
			[MAP.padding + innerW, MAP.padding + innerH]
		],
		collection
	);
	const path = geoPath(projection);

	const states = features.map((f) => ({
		id: f.properties?.NAME ?? f.properties?.name ?? f.id,
		d: path(f) ?? ''
	}));

	/** @param {number} lon @param {number} lat */
	function project(lon, lat) {
		const point = projection([lon, lat]);
		if (!point) return null;
		return { x: point[0], y: point[1] };
	}

	return { width, height, projection, states, project };
}

/**
 * @param {ReturnType<typeof buildMapLayout>} layout
 * @param {{ lon: number, lat: number }[]} sites
 */
export function projectSites(layout, sites) {
	return sites
		.map((site) => {
			const point = layout.project(site.lon, site.lat);
			if (!point) return null;
			return { ...site, ...point };
		})
		.filter(Boolean);
}
