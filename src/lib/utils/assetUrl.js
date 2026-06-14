import { base } from '$app/paths';

/** @type {Record<string, string>} */
const STATIC_ASSET_HASHES =
	typeof __STATIC_ASSET_HASHES__ !== 'undefined' ? __STATIC_ASSET_HASHES__ : {};

export function assetUrl(path) {
	const normalized = path.startsWith('/') ? path : `/${path}`;
	const prefix = (base || '').replace(/\/$/, '');
	const url = !prefix ? normalized : `${prefix}${normalized}`;
	const hash = STATIC_ASSET_HASHES[normalized];
	return hash ? `${url}?v=${hash}` : url;
}
