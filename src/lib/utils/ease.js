/** @param {number} t */
export function easeInOutCubic(t) {
	return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/** @param {number} t */
export function easeOutCubic(t) {
	return 1 - Math.pow(1 - t, 3);
}

/** @param {number} a @param {number} b @param {number} t */
export function lerp(a, b, t) {
	return a + (b - a) * t;
}
