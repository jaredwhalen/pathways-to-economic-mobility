/** @typedef {{ x: number, y: number }} PathwayNode */

/** How far control points sit along each span — higher = wider horizontal swoops. */
const SWOOP_TENSION = 0.68;

/**
 * Cubic segments with vertically aligned control points so each leg bows outward
 * between staggered nodes instead of cutting tight corners.
 * @param {PathwayNode[]} points
 */
export function buildPathThroughNodes(points) {
	if (points.length < 2) return '';

	let path = `M ${format(points[0].x)} ${format(points[0].y)}`;

	for (let index = 0; index < points.length - 1; index += 1) {
		const start = points[index];
		const end = points[index + 1];
		const deltaY = end.y - start.y;
		const control1Y = start.y + deltaY * SWOOP_TENSION;
		const control2Y = end.y - deltaY * SWOOP_TENSION;

		path += ` C ${format(start.x)} ${format(control1Y)}, ${format(end.x)} ${format(control2Y)}, ${format(end.x)} ${format(end.y)}`;
	}

	return path;
}

/**
 * Prepend a top anchor so the path enters from above the first card.
 * @param {PathwayNode[]} nodes
 */
export function withTopAnchor(nodes) {
	if (nodes.length === 0) return nodes;

	const first = nodes[0];

	return [{ x: first.x, y: 0 }, ...nodes];
}

/** @param {number} value */
function format(value) {
	return Math.round(value * 10) / 10;
}
