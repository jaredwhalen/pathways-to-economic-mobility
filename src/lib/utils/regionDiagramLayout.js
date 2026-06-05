import { scaleLinear } from 'd3-scale';

/** @typedef {{ id: string, label: string, color?: string, image?: string | null }} RegionNodeDef */
/** @typedef {{ id: string, label: string, color: string, image: string | null, baseAngle: number, r: number, imageR: number, ringWidth: number, labelGap: number }} RegionNodeBase */
/** @typedef {RegionNodeBase & { x: number, y: number, labelX: number, labelY: number }} RegionNode */
/** @typedef {{ cx: number, cy: number, r: number, stroke: number }} RegionRing */
/** @typedef {{ width: number, height: number, cx: number, cy: number, orbit: number, nodes: RegionNodeBase[], ring: RegionRing, type: { label: number, strokeMaskR: number } }} RegionDiagramLayout */

export const REGION_DIAGRAM_WIDTH = 800;
export const REGION_DIAGRAM_ASPECT = 1;
export const REGION_RING_COLOR = '#ddd';

/** Top, bottom-right, bottom-left — 120° apart (-90°, 30°, 150°). */
const NODE_ANGLE_BY_ID = {
	campus: -Math.PI / 2,
	economy: Math.PI / 6,
	community: (5 * Math.PI) / 6
};

/** @type {RegionNodeDef[]} */
export const REGION_NODES = [
	{
		id: 'campus',
		label: 'Colleges and Universities',
		color: 'var(--color-teal)',
		image: null
	},
	{
		id: 'community',
		label: 'Community Stakeholders',
		color: 'var(--color-yellow)',
		image: null
	},
	{ id: 'economy', label: 'Regional economy', color: 'var(--color-purple)', image: null }
];

/**
 * @param {RegionNodeBase} node
 * @param {number} cx
 * @param {number} cy
 * @param {number} orbit
 * @param {number} rotation
 */
export function positionRotatedNode(node, cx, cy, orbit, rotation) {
	const angle = node.baseAngle + rotation;
	const x = cx + orbit * Math.cos(angle);
	const y = cy + orbit * Math.sin(angle);
	return {
		...node,
		x,
		y,
		labelX: x,
		labelY: y + node.r + node.labelGap
	};
}

/**
 * @param {RegionDiagramLayout} layout
 * @param {number} rotation
 */
export function getRotatedNodes(layout, rotation) {
	return layout.nodes.map((node) =>
		positionRotatedNode(node, layout.cx, layout.cy, layout.orbit, rotation)
	);
}

/**
 * @param {number} width
 * @param {RegionNodeDef[]} [nodes]
 * @param {number} [aspect]
 */
export function buildRegionDiagramLayout(
	width,
	nodes = REGION_NODES,
	aspect = REGION_DIAGRAM_ASPECT
) {
	const height = width * aspect;
	const cx = width / 2;
	const cy = height / 2;
	const orbit = width * 0.34;
	const outerR = scaleLinear().domain([400, 800]).range([52, 78]).clamp(true)(width);
	const ringWidth = scaleLinear().domain([400, 800]).range([5, 7]).clamp(true)(width);
	const imageR = outerR - ringWidth - 2;
	const labelGap = scaleLinear().domain([400, 800]).range([14, 20]).clamp(true)(width);
	const labelSize = scaleLinear().domain([400, 800]).range([13, 17]).clamp(true)(width);
	const connectStroke = scaleLinear().domain([400, 800]).range([7, 11]).clamp(true)(width);
	const strokeMaskPad = scaleLinear().domain([400, 800]).range([5, 8]).clamp(true)(width);
	const strokeMaskR = outerR + connectStroke / 2 + strokeMaskPad;

	const layoutNodes = nodes.map((def) => {
		const baseAngle = NODE_ANGLE_BY_ID[def.id] ?? -Math.PI / 2;

		return {
			id: def.id,
			label: def.label,
			color: def.color ?? 'var(--color-teal)',
			image: def.image ?? null,
			baseAngle,
			r: outerR,
			imageR,
			ringWidth,
			labelGap
		};
	});

	return {
		width,
		height,
		cx,
		cy,
		orbit,
		nodes: layoutNodes,
		ring: {
			cx,
			cy,
			r: orbit,
			stroke: connectStroke
		},
		type: {
			label: labelSize,
			strokeMaskR
		}
	};
}
