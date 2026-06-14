import { base } from '$app/paths';

export function assetUrl(path) {
	const normalized = path.startsWith('/') ? path : `/${path}`;
	const prefix = (base || '').replace(/\/$/, '');
	if (!prefix) return normalized;
	return `${prefix}${normalized}`;
}
