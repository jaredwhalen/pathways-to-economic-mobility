/** @typedef {{ x: number, y: number }} Point */

export const CULTURE_TRIANGLE = {
	width: 580,
	height: 500,
	apex: { x: 0.5, y: 0.07 },
	baseLeft: { x: 0.13, y: 0.93 },
	baseRight: { x: 0.87, y: 0.93 }
};

/** @param {Point} a @param {Point} b @param {number} t */
export function lerpPoint(a, b, t) {
	return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

/** @param {Point} p @param {number} width @param {number} height */
function toPx(p, width, height) {
	return { x: p.x * width, y: p.y * height };
}

/** @param {Point[]} points */
function toPath(points) {
	return points.map((p) => `${p.x},${p.y}`).join(' ');
}

/**
 * @param {number} progress 0–1 scroll progress
 * @param {number} [width]
 * @param {number} [height]
 */
export function buildCultureTriangleLayout(
	progress,
	width = CULTURE_TRIANGLE.width,
	height = CULTURE_TRIANGLE.height
) {
	const t = Math.min(1, Math.max(0, progress));
	const extent = t * 0.5;

	const apex = toPx(CULTURE_TRIANGLE.apex, width, height);
	const baseLeft = toPx(CULTURE_TRIANGLE.baseLeft, width, height);
	const baseRight = toPx(CULTURE_TRIANGLE.baseRight, width, height);

	const outline = toPath([apex, baseLeft, baseRight]);

	const topEdge = extent * 2;
	const topLeft = lerpPoint(apex, baseLeft, topEdge);
	const topRight = lerpPoint(apex, baseRight, topEdge);
	const topFill = topEdge > 0 ? toPath([apex, topLeft, topRight]) : '';

	const bottomEdge = 1 - extent * 2;
	const bottomLeft = lerpPoint(apex, baseLeft, bottomEdge);
	const bottomRight = lerpPoint(apex, baseRight, bottomEdge);
	const bottomFill =
		extent > 0 ? toPath([baseLeft, baseRight, bottomRight, bottomLeft]) : '';

	return {
		width,
		height,
		outline,
		topFill,
		bottomFill,
		apex,
		baseLeft,
		baseRight,
		label: {
			top: { x: apex.x, y: Math.max(22, apex.y - 20) },
			bottom: { x: width / 2, y: Math.min(height - 8, baseLeft.y + 30) }
		}
	};
}
