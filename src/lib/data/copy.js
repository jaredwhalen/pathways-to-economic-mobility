import copy from './copy.json';

/** @typedef {{ id: string, background?: string, text: string, showChart?: boolean }} Slide */

/** @type {Slide[]} */
export const slides = copy.slides;

/** @type {string} */
export const resourcesIntro = copy.resources?.intro ?? '';

/** @type {string[]} */
export const slideIds = slides.map((slide) => slide.id);

/**
 * @param {string} id
 */
export function getSlideIndex(id) {
	return slideIds.indexOf(id);
}

/**
 * @param {string} id
 */
export function getSlideById(id) {
	return slides.find((slide) => slide.id === id);
}

export default copy;
