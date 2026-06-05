import { base } from '$app/paths';

/**
 * Resolve a static file path for standalone and CDN embed deployments.
 * @param {string} path Path starting with /, e.g. /images/foo.webp
 */
export function assetUrl(path) {
	const normalized = path.startsWith('/') ? path : `/${path}`;
	const prefix = (base || '').replace(/\/$/, '');
	if (!prefix) return normalized;
	return `${prefix}${normalized}`;
}
