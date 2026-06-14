<script>
	
	let { names = [], activeIndex = -1 } = $props();

	// Rows rendered above/below the center. The viewport shows 5 rows, so the
	// outermost row on each side sits just outside it and slides in/out smoothly.
	const SPAN = 3;

	// Monotonic position of the active item, so the wrap from the last site back
	// to the first keeps scrolling forward instead of jumping backwards. The
	// closure variables carry the previous value between recomputations.
	let lastActive = -1;
	let position = -1;

	let virtual = $derived.by(() => {
		const count = names.length;
		if (!count) {
			lastActive = -1;
			position = -1;
			return position;
		}
		if (activeIndex < 0) return position;

		if (position < 0) {
			position = activeIndex;
		} else if (activeIndex !== lastActive) {
			position += (activeIndex - lastActive + count) % count;
		}
		lastActive = activeIndex;
		return position;
	});

	let started = $derived(virtual >= 0);
	let center = $derived(started ? virtual : 0);

	let rows = $derived.by(() => {
		const count = names.length;
		if (!count) return [];
		const out = [];
		for (let v = center - SPAN; v <= center + SPAN; v++) {
			out.push({ v, name: names[((v % count) + count) % count] });
		}
		return out;
	});

	let activeName = $derived(names.length ? names[((center % names.length) + names.length) % names.length] : '');

	
	function rowOpacity(distance) {
		if (distance === 0) return 1;
		if (distance === 1) return 0.4;
		if (distance === 2) return 0.22;
		return 0.1;
	}
</script>

<aside class="institution-list" aria-live="polite" aria-label="Case study institutions">
	<span class="sr-only">{activeName}</span>
	<div class="institution-list-viewport">
		{#each rows as row (row.v)}
			<div class="name-row" style:--offset={row.v - center}>
				<p
					class="institution-name"
					class:is-active={started && row.v === center}
					style:opacity={rowOpacity(Math.abs(row.v - center))}
				>
					{row.name}
				</p>
			</div>
		{/each}
	</div>
</aside>

<style>
	.institution-list {
		--row-height: 3.1rem;
		position: absolute;
		left: clamp(1.25rem, 4vw, 3rem);
		top: 50%;
		z-index: 4;
		width: 100%;
		transform: translateY(-50%);
		pointer-events: none;
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}

	.institution-list-viewport {
		position: relative;
		height: calc(var(--row-height) * 5);
		overflow: hidden;
	}

	.name-row {
		position: absolute;
		left: 0;
		right: 0;
		top: 50%;
		transform: translateY(calc(var(--offset) * var(--row-height) - 50%));
		transition: transform 220ms ease-out;
		will-change: transform;
	}

	.institution-name {
		margin: 0;
		padding: 0.45rem 0;
		transform: scale(1);
		transform-origin: left center;
		font-family: var(--font-display, serif);
		font-size: clamp(0.95rem, 1.35vw, 1.2rem);
		line-height: 1.25;
		font-weight: var(--font-weight-regular, 400);
		color: var(--color-teal-dark, #19444a);
		transition:
			opacity 220ms ease-out,
			transform 220ms ease-out;
	}

	.institution-name.is-active {
		transform: scale(1.15);
	}

	@media (prefers-reduced-motion: reduce) {
		.name-row,
		.institution-name {
			transition: none;
		}
	}
</style>
