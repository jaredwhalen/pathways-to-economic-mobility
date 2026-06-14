import copy from './copy.json';

export const slides = copy.slides;

export const resourcesIntro = copy.resources?.intro ?? '';

export const slideIds = slides.map((slide) => slide.id);

export function getSlideIndex(id) {
	return slideIds.indexOf(id);
}

export function getSlideById(id) {
	return slides.find((slide) => slide.id === id);
}

export default copy;
