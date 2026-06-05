import { line as d3Line, curveMonotoneX } from 'd3-shape';
import { scaleLinear } from 'd3-scale';

export const CHART = {
	width: 800,
	height: 480,
	margin: { top: 16, right: 24, bottom: 48, left: 72 }
};

/**
 * @param {{ yearExtent: [number, number], yMax: number }} config
 * @param {{ year: number, value: number }[]} points
 */
export function buildLinePath(config, points) {
	const { width, height, margin } = CHART;
	const innerW = width - margin.left - margin.right;
	const innerH = height - margin.top - margin.bottom;

	const x = scaleLinear().domain(config.yearExtent).range([0, innerW]);
	const y = scaleLinear().domain([0, config.yMax]).range([innerH, 0]);

	const pathGen = d3Line()
		.x((d) => x(d.year))
		.y((d) => y(d.value))
		.curve(curveMonotoneX);

	return {
		path: pathGen(points) ?? '',
		x,
		y,
		innerW,
		innerH,
		margin
	};
}

/**
 * Evenly spaced integer year labels across the full extent, regardless of
 * which years have data points.
 * @param {number} min
 * @param {number} max
 */
export function yearTicks(min, max) {
	const lo = Math.floor(min + 1e-6);
	const hi = Math.ceil(max - 1e-6);
	if (hi < lo) return [];

	const span = hi - lo;
	const step = span <= 8 ? 1 : span <= 16 ? 2 : 4;

	const ticks = [];
	for (let y = lo; y <= hi; y += step) ticks.push(y);
	return ticks;
}

/**
 * Fixed dollar tick values on a regular grid. During animated y-scale
 * transitions, pass `currentMax` so labels stay at round values while the
 * axis extends or contracts (same behavior as yearTicks on the x-axis).
 * @param {number} step
 * @param {number} ceiling
 * @param {number} [currentMax]
 */
export function valueTicks(step, ceiling, currentMax = ceiling) {
	const ticks = [];
	for (let v = 0; v <= ceiling; v += step) {
		if (v <= currentMax + 1e-6) ticks.push(v);
	}
	return ticks;
}

/** @param {number} value */
export function formatDollars(value) {
	if (value === 0) return '$0k';
	return `$${Math.round(value / 1000)}k`;
}

/**
 * Draw line from left when `animate` becomes true.
 * @param {SVGPathElement} node
 * @param {{ animate: boolean, duration?: number, delay?: number }} params
 */
export function drawLine(node, params) {
	let drawn = false;
	let animating = false;
	let wasAnimate = params.animate;

	const apply = (animate, duration, delay) => {
		const tryDraw = () => {
			const length = node.getTotalLength();
			if (!length) {
				requestAnimationFrame(() => tryDraw());
				return;
			}

			node.style.strokeDasharray = `${length}`;

			if (animating) return;

			if (animate && !drawn) {
				animating = true;
				node.style.strokeDashoffset = `${length}`;
				node.style.transition = 'none';

				const run = () => {
					node.style.transition = `stroke-dashoffset ${duration}ms ease-out`;
					node.style.strokeDashoffset = '0';
					window.setTimeout(() => {
						drawn = true;
						animating = false;
					}, duration + delay);
				};

				if (delay > 0) window.setTimeout(run, delay);
				else requestAnimationFrame(() => requestAnimationFrame(run));
			} else if (drawn || (!animate && length)) {
				node.style.strokeDashoffset = '0';
				node.style.transition = 'none';
				if (!animate) drawn = true;
			} else {
				node.style.strokeDashoffset = `${length}`;
				node.style.transition = 'none';
			}
		};

		tryDraw();
	};

	apply(params.animate, params.duration ?? 850, params.delay ?? 0);

	return {
		update(next) {
			const animate = next.animate ?? false;

			if (animate && !wasAnimate) {
				drawn = false;
				animating = false;
			}

			wasAnimate = animate;
			apply(animate, next.duration ?? 850, next.delay ?? 0);
		}
	};
}
