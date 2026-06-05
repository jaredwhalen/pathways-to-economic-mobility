/** @typedef {{ onReveal?: () => void }} RevealOnScrollOptions */

/**
 * @param {HTMLElement} node
 * @param {() => void} [onReveal]
 */
function reveal(node, onReveal) {
	node.classList.add('is-revealed');
	onReveal?.();
}

/**
 * @param {HTMLElement} node
 * @param {RevealOnScrollOptions | (() => void) | undefined} params
 */
function resolveOnReveal(params) {
	if (typeof params === 'function') return params;
	return params?.onReveal;
}

/** @type {import('svelte/action').Action<HTMLElement, RevealOnScrollOptions | (() => void) | undefined>} */
export function revealOnScroll(node, params) {
	let onReveal = resolveOnReveal(params);
	let revealed = false;
	/** @type {IntersectionObserver | undefined} */
	let observer;

	const commitReveal = () => {
		if (revealed) return;
		revealed = true;
		reveal(node, onReveal);
		observer?.disconnect();
		observer = undefined;
	};

	const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	if (prefersReducedMotion || typeof IntersectionObserver === 'undefined') {
		commitReveal();
		return {};
	}

	observer = new IntersectionObserver(
		([entry]) => {
			if (entry?.isIntersecting) {
				commitReveal();
			}
		},
		{ threshold: 0.08, rootMargin: '0px 0px -5% 0px' }
	);

	observer.observe(node);

	// Catch elements already in view when the observer attaches.
	requestAnimationFrame(() => {
		const rect = node.getBoundingClientRect();
		const viewportBottom = window.innerHeight * 0.95;

		if (rect.top < viewportBottom && rect.bottom > 0) {
			commitReveal();
		}
	});

	return {
		update(nextParams) {
			onReveal = resolveOnReveal(nextParams) ?? onReveal;
			if (revealed) return;
		},
		destroy() {
			observer?.disconnect();
		}
	};
}
