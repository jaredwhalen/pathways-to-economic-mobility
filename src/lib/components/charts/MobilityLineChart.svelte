<script>
	import { collegeCost } from '$lib/utils/parseCollegeCost.js';
	import { postCollegeEarnings } from '$lib/utils/parsePostCollegeEarnings.js';
	import {
		CHART,
		buildLinePath,
		drawLine,
		yearTicks,
		valueTicks,
		formatDollars
	} from '$lib/utils/chartLayout.js';
	import { tick } from 'svelte';
	import { getSlideIndex } from '$lib/data/copy.js';
	import { easeInOutCubic, lerp } from '$lib/utils/ease.js';

	/** @type {{ slideId?: string }} */
	let { slideId = 'college-cost' } = $props();

	const SOURCE = 'Source: U.S. Department of Education College Scorecard';
	const FADE_MS = 280;
	const SCALE_MS = 650;
	const DRAW_MS = 850;
	const ENTER_DELAY_MS = 400;
	const LINE_STAGGER_MS = 55;
	const Y_TICK_STEP = 10000;
	const COST_DRAW_WAIT = DRAW_MS + (collegeCost.series.length - 1) * LINE_STAGGER_MS;
	const EARNINGS_DRAW_WAIT = DRAW_MS + (postCollegeEarnings.series.length - 1) * LINE_STAGGER_MS;

	const views = {
		cost: {
			yLabel: collegeCost.yLabel,
			yearExtent: collegeCost.yearExtent,
			yMax: collegeCost.yMax,
			series: collegeCost.series
		},
		earnings: {
			yLabel: postCollegeEarnings.yLabel,
			yearExtent: postCollegeEarnings.yearExtent,
			yMax: postCollegeEarnings.yMax,
			series: postCollegeEarnings.series
		}
	};

	const Y_TICK_CEILING = Math.max(views.cost.yMax, views.earnings.yMax);

	/** @typedef {{ yearMin: number, yearMax: number, yMax: number, yLabelMix: number, chromeOpacity: number, legendOpacity: number, costLineOpacity: number, earningsLineOpacity: number, dotsOpacity: number, costDrawGen: number, earningsDrawGen: number }} ChartFrame */

	let frame = /** @type {ChartFrame} */ ($state({
		yearMin: views.cost.yearExtent[0],
		yearMax: views.cost.yearExtent[1],
		yMax: views.cost.yMax,
		yLabelMix: 0,
		chromeOpacity: 0,
		legendOpacity: 0,
		costLineOpacity: 0,
		earningsLineOpacity: 0,
		dotsOpacity: 0,
		costDrawGen: 0,
		earningsDrawGen: 0
	}));

	let activeView = /** @type {'cost' | 'earnings' | null} */ ($state(null));
	let sequenceId = 0;
	let rafId = 0;
	let prevSlideId = '';

	function scaleTarget(view) {
		const v = views[view];
		return {
			yearMin: v.yearExtent[0],
			yearMax: v.yearExtent[1],
			yMax: v.yMax,
			yLabelMix: view === 'earnings' ? 1 : 0
		};
	}

	/** @param {Partial<ChartFrame>} target @param {number} duration */
	function animateProps(target, duration) {
		return new Promise((resolve) => {
			const from = { ...frame };
			const keys = /** @type {(keyof ChartFrame)[]} */ (Object.keys(target));
			const start = performance.now();

			cancelAnimationFrame(rafId);

			const tick = (now) => {
				const t = Math.min(1, (now - start) / duration);
				const e = easeInOutCubic(t);
				const next = { ...frame };

				for (const key of keys) {
					const a = from[key];
					const b = target[key];
					if (typeof a === 'number' && typeof b === 'number') {
						next[key] = lerp(a, b, e);
					}
				}

				frame = next;

				if (t < 1) {
					rafId = requestAnimationFrame(tick);
				} else {
					resolve(undefined);
				}
			};

			rafId = requestAnimationFrame(tick);
		});
	}

	/** @param {number} ms */
	function wait(ms) {
		const id = sequenceId;
		return new Promise((resolve) => {
			setTimeout(() => resolve(id === sequenceId), ms);
		});
	}

	async function enterCost() {
		const id = ++sequenceId;
		activeView = 'cost';

		frame = {
			...scaleTarget('cost'),
			yLabelMix: 0,
			chromeOpacity: 1,
			legendOpacity: 0,
			costLineOpacity: 0,
			earningsLineOpacity: 0,
			dotsOpacity: 0,
			costDrawGen: 0,
			earningsDrawGen: 0
		};

		await wait(ENTER_DELAY_MS);
		if (id !== sequenceId) return;

		frame = { ...frame, costLineOpacity: 1, costDrawGen: frame.costDrawGen + 1 };
		animateProps({ legendOpacity: 1 }, FADE_MS);
		await wait(COST_DRAW_WAIT);
	}

	function showCostRest() {
		sequenceId++;
		cancelAnimationFrame(rafId);
		activeView = 'cost';
		frame = {
			...scaleTarget('cost'),
			yLabelMix: 0,
			chromeOpacity: 1,
			legendOpacity: 1,
			costLineOpacity: 1,
			earningsLineOpacity: 0,
			dotsOpacity: 0,
			costDrawGen: Math.max(frame.costDrawGen, 1),
			earningsDrawGen: frame.earningsDrawGen
		};
	}

	async function transitionToEarnings() {
		const id = ++sequenceId;
		activeView = 'earnings';

		await animateProps({ costLineOpacity: 0, legendOpacity: 0 }, FADE_MS);
		if (id !== sequenceId) return;

		await animateProps(scaleTarget('earnings'), SCALE_MS);
		if (id !== sequenceId) return;

		frame = {
			...frame,
			earningsLineOpacity: 0,
			dotsOpacity: 0,
			earningsDrawGen: frame.earningsDrawGen + 1
		};

		await tick();

		if (id !== sequenceId) return;

		frame = { ...frame, earningsLineOpacity: 1 };
		animateProps({ legendOpacity: 1 }, FADE_MS);
		await wait(EARNINGS_DRAW_WAIT);
		if (id !== sequenceId) return;

		await animateProps({ dotsOpacity: 1 }, FADE_MS);
	}

	async function transitionToCost() {
		const id = ++sequenceId;
		activeView = 'cost';

		await animateProps({ earningsLineOpacity: 0, dotsOpacity: 0, legendOpacity: 0 }, FADE_MS);
		if (id !== sequenceId) return;

		await animateProps(scaleTarget('cost'), SCALE_MS);
		if (id !== sequenceId) return;

		frame = {
			...frame,
			costLineOpacity: 0,
			earningsLineOpacity: 0,
			dotsOpacity: 0,
			costDrawGen: frame.costDrawGen + 1
		};

		await tick();

		if (id !== sequenceId) return;

		frame = { ...frame, costLineOpacity: 1 };
		animateProps({ legendOpacity: 1 }, FADE_MS);
		await wait(COST_DRAW_WAIT);
	}

	function showEarningsRest() {
		sequenceId++;
		cancelAnimationFrame(rafId);
		activeView = 'earnings';
		frame = {
			...scaleTarget('earnings'),
			yLabelMix: 1,
			chromeOpacity: 1,
			legendOpacity: 1,
			costLineOpacity: 0,
			earningsLineOpacity: 1,
			dotsOpacity: 1,
			costDrawGen: Math.max(frame.costDrawGen, 1),
			earningsDrawGen: Math.max(frame.earningsDrawGen, 1)
		};
	}

	$effect(() => {
		const id = slideId;
		if (id === prevSlideId) return;

		const prevIndex = getSlideIndex(prevSlideId);
		const currentIndex = getSlideIndex(id);
		const direction = currentIndex > prevIndex ? 'down' : 'up';
		const costIndex = getSlideIndex('college-cost');
		const earningsIndex = getSlideIndex('earnings-inequality');

		if (id === 'earnings-inequality' && prevSlideId === 'college-cost') {
			transitionToEarnings();
		} else if (id === 'college-cost' && prevSlideId === 'earnings-inequality') {
			transitionToCost();
		} else if (direction === 'down') {
			if (id === 'college-cost' && prevIndex < costIndex) enterCost();
			else if (id === 'earnings-inequality') showEarningsRest();
		} else if (direction === 'up') {
			if (id === 'college-cost') showCostRest();
			else if (id === 'earnings-inequality') showEarningsRest();
		}

		prevSlideId = id;
	});

	$effect(() => {
		return () => {
			cancelAnimationFrame(rafId);
			sequenceId++;
		};
	});

	const { width, height, margin } = CHART;
	const innerW = width - margin.left - margin.right;
	const innerH = height - margin.top - margin.bottom;

	let scaleConfig = $derived({
		yearExtent: [frame.yearMin, frame.yearMax],
		yMax: frame.yMax
	});

	let xTicks = $derived(yearTicks(frame.yearMin, frame.yearMax));
	let yTicks = $derived(valueTicks(Y_TICK_STEP, Y_TICK_CEILING, frame.yMax));

	let layout = $derived(buildLinePath(scaleConfig, [{ year: frame.yearMin, value: 0 }]));

	let costSeries = $derived(
		collegeCost.series.map((s) => {
			const built = buildLinePath(scaleConfig, s.points);
			return { ...s, ...built };
		})
	);

	let earningsSeries = $derived(
		postCollegeEarnings.series.map((s) => {
			const built = buildLinePath(scaleConfig, s.points);
			const dots = (s.observed ?? []).map((p) => ({
				...p,
				cx: built.x(p.year),
				cy: built.y(p.value)
			}));
			return { ...s, ...built, dots };
		})
	);

	let showCostLegend = $derived(frame.yLabelMix < 0.5);
</script>

<div class="mobility-chart">
	<div class="legend-host">
		<ul class="legend" class:is-visible={showCostLegend} style:opacity={frame.legendOpacity}>
			{#each costSeries as s (s.id)}
				<li class="legend-item">
					<svg class="legend-swatch" width="28" height="10" aria-hidden="true">
						<line x1="0" y1="5" x2="28" y2="5" stroke={s.color} stroke-width="3" />
					</svg>
					<span class="legend-label">{s.id}</span>
				</li>
			{/each}
		</ul>
		<ul class="legend" class:is-visible={!showCostLegend} style:opacity={frame.legendOpacity}>
			{#each earningsSeries as s (s.id)}
				<li class="legend-item">
					<svg class="legend-swatch" width="28" height="10" aria-hidden="true">
						<line x1="0" y1="5" x2="28" y2="5" stroke={s.color} stroke-width="3" />
					</svg>
					<span class="legend-label">{s.id}</span>
				</li>
			{/each}
		</ul>
	</div>

	<svg class="chart-svg" viewBox="0 0 {width} {height}" role="img">
		<g transform="translate({margin.left}, {margin.top})" opacity={frame.chromeOpacity}>
			{#each yTicks as tick}
				<g class="y-tick" transform="translate(0, {layout.y(tick)})">
					<line x1={0} x2={innerW} class="grid-line" />
					<text x={-10} y={4} text-anchor="end" class="axis-label">{formatDollars(tick)}</text>
				</g>
			{/each}

			{#each xTicks as tick}
				<g class="x-tick" transform="translate({layout.x(tick)}, {innerH})">
					<text y={22} text-anchor="middle" class="axis-label">{Math.round(tick)}</text>
				</g>
			{/each}

			<text
				transform="rotate(-90)"
				x={-innerH / 2}
				y={-52}
				text-anchor="middle"
				class="axis-title"
				opacity={1 - frame.yLabelMix}
			>
				{views.cost.yLabel}
			</text>
			<text
				transform="rotate(-90)"
				x={-innerH / 2}
				y={-52}
				text-anchor="middle"
				class="axis-title"
				opacity={frame.yLabelMix}
			>
				{views.earnings.yLabel}
			</text>

			{#each costSeries as s, i (s.id)}
				<g opacity={frame.costLineOpacity}>
					{#key `${s.id}-${frame.costDrawGen}`}
						<path
							d={s.path}
							class="series-line"
							stroke={s.color}
							use:drawLine={{
								animate: frame.costLineOpacity > 0 && frame.costDrawGen > 0,
								duration: DRAW_MS,
								delay: i * LINE_STAGGER_MS
							}}
						/>
					{/key}
				</g>
			{/each}

			{#each earningsSeries as s, i (s.id)}
				<g opacity={frame.earningsLineOpacity}>
					{#key `${s.id}-${frame.earningsDrawGen}`}
						<path
							d={s.path}
							class="series-line"
							stroke={s.color}
							use:drawLine={{
								animate: frame.earningsLineOpacity > 0 && frame.earningsDrawGen > 0,
								duration: DRAW_MS,
								delay: i * LINE_STAGGER_MS
							}}
						/>
					{/key}
					{#each s.dots as dot (dot.year)}
						<circle
							cx={dot.cx}
							cy={dot.cy}
							r={4}
							class="series-dot"
							fill={s.color}
							opacity={frame.dotsOpacity}
						/>
					{/each}
				</g>
			{/each}
		</g>
	</svg>

	<p class="chart-source" style:opacity={frame.chromeOpacity}>{SOURCE}</p>
</div>

<style>
	.mobility-chart {
		width: 100%;
		height: 100dvh;
		min-height: 100dvh;
		display: flex;
		flex-direction: column;
		background: var(--color-white);
	}

	.chart-svg {
		flex: 1 1 auto;
		width: 100%;
		min-height: 0;
		display: block;
	}

	.chart-svg :global(.grid-line) {
		stroke: #e8e8e8;
		stroke-width: 1;
	}

	.chart-svg :global(.axis-label) {
		font-family: var(--font-body);
		font-size: 11px;
		fill: var(--color-navy);
	}

	.chart-svg :global(.axis-title) {
		font-family: var(--font-body);
		font-size: 12px;
		fill: var(--color-navy);
		font-weight: var(--font-weight-regular);
	}

	.chart-svg :global(.series-line) {
		fill: none;
		stroke-width: 2.5;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	.chart-svg :global(.series-dot) {
		stroke: var(--color-white);
		stroke-width: 1.5;
	}

	.legend-host {
		position: relative;
		flex-shrink: 0;
		min-height: 3.25rem;
		padding: 1.25rem 1.5rem 0.75rem;
		border-bottom: 1px solid #eee;
	}

	.legend {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		align-items: center;
		gap: 1rem 1.75rem;
		position: absolute;
		left: 50%;
		top: 1.25rem;
		transform: translateX(-50%);
		width: max-content;
		max-width: calc(100% - 3rem);
		opacity: 0;
		transition: opacity 280ms ease-in-out;
		pointer-events: none;
		visibility: hidden;
	}

	.legend.is-visible {
		visibility: visible;
		pointer-events: auto;
	}

	.legend-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-family: var(--font-body);
		font-size: 0.9375rem;
		color: var(--color-navy);
	}

	.legend-swatch {
		flex-shrink: 0;
		display: block;
	}

	.legend-label {
		white-space: nowrap;
	}

	.chart-source {
		margin: 0;
		padding: 0 1.25rem 1rem;
		font-family: var(--font-body);
		font-size: 0.625rem;
		line-height: 1.4;
		color: var(--color-teal);
		transition: opacity 0.15s linear;
	}
</style>
