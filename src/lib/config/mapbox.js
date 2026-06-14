export function getMapboxToken() {
	return import.meta.env.DEV
		? (import.meta.env.MAPBOX_TOKEN_DEV ?? '')
		: (import.meta.env.MAPBOX_TOKEN_PROD ?? '');
}

export function hasMapboxToken() {
	return Boolean(getMapboxToken());
}

export const MAPBOX_STYLE = 'mapbox://styles/jared-whalen/clyd2jiip012c01qoc8r6eark';
