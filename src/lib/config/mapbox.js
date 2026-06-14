
export function getMapboxToken() {
	return import.meta.env.MAPBOX_TOKEN ?? import.meta.env.PUBLIC_MAPBOX_TOKEN ?? '';
}

export function hasMapboxToken() {
	return Boolean(getMapboxToken());
}

export const MAPBOX_STYLE = 'mapbox://styles/jared-whalen/clyd2jiip012c01qoc8r6eark';
