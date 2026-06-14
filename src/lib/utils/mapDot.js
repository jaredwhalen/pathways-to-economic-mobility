import { easeOutCubic } from '$lib/utils/ease.js';

export function popDot(node, params) {
	let raf = 0;
	let animating = false;
	let lastGen = -1;

	function setRest(r) {
		cancelAnimationFrame(raf);
		animating = false;
		node.setAttribute('r', String(r));
		node.style.opacity = '1';
	}

	function setHidden() {
		cancelAnimationFrame(raf);
		animating = false;
		node.setAttribute('r', '0');
		node.style.opacity = '0';
	}

	function runPop({ delay, duration, r }) {
		cancelAnimationFrame(raf);
		animating = true;
		node.setAttribute('r', '0');
		node.style.opacity = '0';
		const startAt = performance.now() + delay;

		const tick = (now) => {
			if (now < startAt) {
				raf = requestAnimationFrame(tick);
				return;
			}
			const t = Math.min(1, (now - startAt) / duration);
			const e = easeOutCubic(t);
			node.setAttribute('r', String(e * r));
			node.style.opacity = String(e);
			if (t < 1) {
				raf = requestAnimationFrame(tick);
			} else {
				animating = false;
				raf = 0;
			}
		};

		raf = requestAnimationFrame(tick);
	}

	function apply({ animate, visible, gen = 0, delay = 0, duration = 450, r }) {
		if (visible) {
			lastGen = gen;
			setRest(r);
			return;
		}

		if (gen === 0) {
			lastGen = -1;
			if (!animating) setHidden();
			return;
		}

		if (animate && gen > 0 && gen !== lastGen) {
			lastGen = gen;
			runPop({ delay, duration, r });
			return;
		}

		if (!animate && !visible && !animating) {
			setHidden();
		}
	}

	apply(params);

	return {
		update(next) {
			apply(next);
		},
		destroy() {
			cancelAnimationFrame(raf);
		}
	};
}
