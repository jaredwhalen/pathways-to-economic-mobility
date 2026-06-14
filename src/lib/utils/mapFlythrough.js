import { easeInOutCubic, lerp } from '$lib/utils/ease.js';

export function buildTourOrder(sites) {
	if (!sites.length) return [];

	const pool = [...sites].sort((a, b) => (a.lon ?? a.x) - (b.lon ?? b.x));
	
	const order = [];
	let current = pool.shift();
	if (!current) return [];

	order.push(current);

	while (pool.length) {
		let best = 0;
		let bestDist = Infinity;

		for (let i = 0; i < pool.length; i++) {
			const dx = (pool[i].x ?? pool[i].lon ?? 0) - (current.x ?? current.lon ?? 0);
			const dy = (pool[i].y ?? pool[i].lat ?? 0) - (current.y ?? current.lat ?? 0);
			const dist = dx * dx + dy * dy;
			if (dist < bestDist) {
				bestDist = dist;
				best = i;
			}
		}

		current = pool.splice(best, 1)[0];
		order.push(current);
	}

	return order;
}

export function getOverviewFocus(mapSize) {
	return { x: mapSize.width / 2, y: mapSize.height / 2 };
}

export function getViewTransform(focus, scale, mapSize) {
	const cx = mapSize.width / 2;
	const cy = mapSize.height / 2;

	return {
		scale,
		tx: cx - focus.x * scale,
		ty: cy - focus.y * scale
	};
}

export function viewTransformString({ scale, tx, ty }) {
	return `translate(${tx}, ${ty}) scale(${scale})`;
}

export function bezierControlPoint(from, to, bend = 0.22) {
	const mx = (from.x + to.x) / 2;
	const my = (from.y + to.y) / 2;
	const dx = to.x - from.x;
	const dy = to.y - from.y;
	const len = Math.hypot(dx, dy) || 1;
	const dist = len * bend;

	return {
		x: mx + (-dy / len) * dist,
		y: my + (dx / len) * dist
	};
}

export function quadraticBezierPoint(from, control, to, t) {
	const mt = 1 - t;

	return {
		x: mt * mt * from.x + 2 * mt * t * control.x + t * t * to.x,
		y: mt * mt * from.y + 2 * mt * t * control.y + t * t * to.y
	};
}

export function planeHeading(from, control, to, t) {
	const delta = 0.015;
	const t0 = Math.max(0, t - delta);
	const t1 = Math.min(1, t + delta);
	const p0 = quadraticBezierPoint(from, control, to, t0);
	const p1 = quadraticBezierPoint(from, control, to, t1);

	return (Math.atan2(p1.y - p0.y, p1.x - p0.x) * 180) / Math.PI;
}

export function wrapInstitutionName(name, maxLen = 32) {
	const words = name.split(/\s+/);
	
	const lines = [];
	let line = '';

	for (const word of words) {
		const next = line ? `${line} ${word}` : word;
		if (next.length > maxLen && line) {
			lines.push(line);
			line = word;
		} else {
			line = next;
		}
	}

	if (line) lines.push(line);
	return lines;
}

export function estimateBezierLength(from, control, to, samples = 14) {
	let length = 0;
	let prev = from;

	for (let i = 1; i <= samples; i++) {
		const point = quadraticBezierPoint(from, control, to, i / samples);
		length += Math.hypot(point.x - prev.x, point.y - prev.y);
		prev = point;
	}

	return length;
}

export function buildTourSegments(sites) {
	if (sites.length < 2) return [];

	
	const segments = [];

	for (let i = 0; i < sites.length - 1; i++) {
		const from = { x: sites[i].x, y: sites[i].y };
		const to = { x: sites[i + 1].x, y: sites[i + 1].y };
		segments.push({
			from,
			control: bezierControlPoint(from, to),
			to
		});
	}

	return segments;
}

export function animateIntroZoom({
	fromFocus,
	toSite,
	duration,
	overviewScale,
	siteScale,
	onUpdate,
	onArrive,
	arrivalAt = 0.7,
	shouldContinue = () => true
}) {
	const to = { x: toSite.x, y: toSite.y };
	const control = bezierControlPoint(fromFocus, to);

	return new Promise((resolve) => {
		const start = performance.now();
		let raf = 0;
		let arrived = false;

		const tick = (now) => {
			if (!shouldContinue()) {
				cancelAnimationFrame(raf);
				resolve(undefined);
				return;
			}

			const progress = Math.min(1, (now - start) / duration);
			const eased = easeInOutCubic(progress);
			const plane = quadraticBezierPoint(fromFocus, control, to, eased);
			const planeRotation = planeHeading(fromFocus, control, to, eased);

			if (!arrived && onArrive && progress >= arrivalAt) {
				arrived = true;
				onArrive();
			}

			onUpdate({
				plane,
				planeRotation,
				focus: plane,
				scale: lerp(overviewScale, siteScale, eased),
				planeOpacity: Math.min(1, progress * 1.4)
			});

			if (progress < 1) {
				raf = requestAnimationFrame(tick);
			} else {
				if (!arrived && onArrive) onArrive();
				resolve(undefined);
			}
		};

		raf = requestAnimationFrame(tick);
	});
}

export function isSameRegion(fromSite, toSite) {
	if (!fromSite || !toSite) return true;
	return (fromSite.state ?? '') === (toSite.state ?? '');
}

export function animateFlightLeg({
	from,
	to,
	fromSite,
	toSite,
	duration,
	overviewScale,
	siteScale,
	onUpdate,
	onDepart,
	onArrive,
	arrivalAt = 0.7,
	shouldContinue = () => true
}) {
	const control = bezierControlPoint(from, to);
	const crossRegion = !isSameRegion(fromSite, toSite);

	return new Promise((resolve) => {
		const start = performance.now();
		let raf = 0;
		let departed = false;
		let arrived = false;

		const tick = (now) => {
			if (!shouldContinue()) {
				cancelAnimationFrame(raf);
				resolve(undefined);
				return;
			}

			if (!departed && onDepart) {
				departed = true;
				onDepart();
			}

			const progress = Math.min(1, (now - start) / duration);
			const eased = easeInOutCubic(progress);
			const plane = quadraticBezierPoint(from, control, to, eased);
			const planeRotation = planeHeading(from, control, to, eased);

			if (!arrived && onArrive && progress >= arrivalAt) {
				arrived = true;
				onArrive();
			}

			let scale = siteScale;
			if (crossRegion) {
				if (progress <= 0.5) {
					scale = lerp(siteScale, overviewScale, easeInOutCubic(progress / 0.5));
				} else {
					scale = lerp(
						overviewScale,
						siteScale,
						easeInOutCubic((progress - 0.5) / 0.5)
					);
				}
			}

			onUpdate({
				plane,
				planeRotation,
				focus: plane,
				scale
			});

			if (progress < 1) {
				raf = requestAnimationFrame(tick);
			} else {
				if (!arrived && onArrive) onArrive();
				resolve(undefined);
			}
		};

		raf = requestAnimationFrame(tick);
	});
}

export function animateScalar({ from, to, duration, onUpdate, shouldContinue = () => true }) {
	return new Promise((resolve) => {
		const start = performance.now();
		let raf = 0;

		const tick = (now) => {
			if (!shouldContinue()) {
				cancelAnimationFrame(raf);
				resolve(undefined);
				return;
			}

			const progress = Math.min(1, (now - start) / duration);
			const eased = easeInOutCubic(progress);

			onUpdate(lerp(from, to, eased));

			if (progress < 1) {
				raf = requestAnimationFrame(tick);
			} else {
				resolve(undefined);
			}
		};

		raf = requestAnimationFrame(tick);
	});
}
