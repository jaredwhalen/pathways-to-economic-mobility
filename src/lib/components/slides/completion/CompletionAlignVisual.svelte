<script>
	const STAGGER_MS = 250;
	const ENTER_DELAY_MS = 500;
	const MAX_PHRASE_PX = 36;
	const MIN_PHRASE_PX = 10;
	const PHRASE_COLORS = [
		'var(--color-orange)',
		'var(--color-teal)',
		'var(--color-blue)'
	];
	const EM_DASH_HTML = '&#8212;';

	let { phrases = [], active = false, passed = false } = $props();

	let lineEl = $state(undefined);
	let visible = $state(false);
	let hasPlayed = false;

	function fitPhraseLine() {
		const node = lineEl;
		if (!node) return;

		node.style.setProperty('--phrase-size', `${MAX_PHRASE_PX}px`);

		let size = MAX_PHRASE_PX;
		while (node.scrollWidth > node.clientWidth && size > MIN_PHRASE_PX) {
			size -= 1;
			node.style.setProperty('--phrase-size', `${size}px`);
		}
	}

	$effect(() => {
		const node = lineEl;
		if (!node) return;

		phrases;
		fitPhraseLine();

		const observer = new ResizeObserver(fitPhraseLine);
		observer.observe(node);

		let cancelled = false;
		document.fonts?.ready.then(() => {
			if (!cancelled) fitPhraseLine();
		});

		return () => {
			cancelled = true;
			observer.disconnect();
		};
	});

	$effect(() => {
		if (hasPlayed) return;

		if (passed) {
			hasPlayed = true;
			visible = true;
			return;
		}

		if (!active) return;

		let cancelled = false;
		let timeoutId;

		const outerId = requestAnimationFrame(() => {
			requestAnimationFrame(() => {
				if (cancelled) return;
				timeoutId = setTimeout(() => {
					if (cancelled) return;
					visible = true;
					hasPlayed = true;
				}, ENTER_DELAY_MS);
			});
		});

		return () => {
			cancelled = true;
			cancelAnimationFrame(outerId);
			clearTimeout(timeoutId);
		};
	});
</script>

<p bind:this={lineEl} class="phrase-line" class:visible>
	{#each phrases as phrase, i (phrase)}
		{#if i > 0}
			<span
				class="phrase-separator"
				style:--item-delay="{i * STAGGER_MS}ms"
				aria-hidden="true"
			>{@html EM_DASH_HTML}</span>
		{/if}
		<span
			class="phrase-item"
			style:--phrase-color={PHRASE_COLORS[i % PHRASE_COLORS.length]}
			style:--item-delay="{i * STAGGER_MS}ms"
		>
			{phrase}
		</span>
	{/each}
</p>

<style>
	.phrase-line {
		display: flex;
		flex-wrap: nowrap;
		justify-content: center;
		align-items: baseline;
		width: 100%;
		gap: 0.35em 0.5em;
		margin: 0.75rem 0 1rem;
		font-size: var(--phrase-size, 2.25rem);
		text-align: center;
	}

	.phrase-item,
	.phrase-separator {
		opacity: 0;
		transform: translateX(1.25rem);
	}

	.phrase-item {
		font-family: var(--font-body);
		font-size: 1em;
		font-weight: var(--font-weight-bold);
		line-height: 1.15;
		color: var(--phrase-color);
		white-space: nowrap;
	}

	.phrase-separator {
		font-family: var(--font-body);
		font-size: 0.72em;
		font-weight: var(--font-weight-light);
		line-height: 1.15;
		color: var(--text-body-color);
		white-space: nowrap;
	}

	.phrase-line.visible .phrase-item,
	.phrase-line.visible .phrase-separator {
		opacity: 1;
		transform: translateX(0);
		transition:
			opacity 420ms ease,
			transform 520ms cubic-bezier(0.22, 1, 0.36, 1);
		transition-delay: var(--item-delay);
	}

	@media (prefers-reduced-motion: reduce) {
		.phrase-line.visible .phrase-item,
		.phrase-line.visible .phrase-separator {
			opacity: 1;
			transform: none;
			transition: none;
		}
	}
</style>
