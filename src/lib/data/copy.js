import rawCopy from './copy.json';
import { normalizeCopyStrings } from '$lib/utils/normalizeCopyText.js';

const copy = normalizeCopyStrings(rawCopy);

const RESOURCE_SITE_BASE = 'https://publicagenda.org';

/**
 * Slide copy fields (sourced from Archie / copy.json):
 * - text: body copy; supports [[token]]highlights[[/]], <b>bold</b>, and
 *   [[align]]phrase one|phrase two|phrase three[[/]] for animated lists
 *
 * Resources fields:
 * - resources.intro: toolkit section intro
 * - resources.items[]: resource cards (id, title, description, path, thumbnail)
 */
export const slides = copy.slides;

export const resourcesIntro = copy.resources?.intro ?? '';

export const resources = copy.resources?.items ?? [];

export const slideIds = slides.map((slide) => slide.id);

export function getSlideIndex(id) {
	return slideIds.indexOf(id);
}

export function getSlideById(id) {
	return slides.find((slide) => slide.id === id);
}

export function getResourceUrl(path) {
	return new URL(path, RESOURCE_SITE_BASE).href;
}

export default copy;
