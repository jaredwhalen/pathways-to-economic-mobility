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
			xLabel: 'Academic year',
			yearExtent: collegeCost.yearExtent,
			yMax: collegeCost.yMax,
			series: collegeCost.series
		},
		earnings: {
			yLabel: postCollegeEarnings.yLabel,
			xLabel: 'Year',
			yearExtent: postCollegeEarnings.yearExtent,
			yMax: postCollegeEarnings.yMax,
			series: postCollegeEarnings.series
		}
	};

	const Y_TICK_CEILING = Math.max(views.cost.yMax, views.earnings.yMax);

	const MOBILE_BREAKPOINT = 768;
	const DESKTOP_MARGIN = { top: 20, right: 28, bottom: 60, left: 76 };
	const MOBILE_MARGIN = { top: 16, right: 30, bottom: 48, left: 70 };

	

	let frame = $state({
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
	});

	let activeView = $state(null);
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

	
	function animateProps(target, duration) {
		return new Promise((resolve) => {
			const from = { ...frame };
			const keys = (Object.keys(target));
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

	let showCostLegend = $derived(frame.yLabelMix < 0.5);

	let chartStage = $state(null);
	let stageSize = $state({ width: 0, height: 0 });

	$effect(() => {
		const el = chartStage;
		if (!el) return;

		const observer = new ResizeObserver(([entry]) => {
			const { width, height } = entry.contentRect;
			stageSize = { width, height };
		});

		observer.observe(el);
		return () => observer.disconnect();
	});

	let isDesktop = $derived(stageSize.width >= MOBILE_BREAKPOINT);

	let chartMargin = $derived(isDesktop ? DESKTOP_MARGIN : MOBILE_MARGIN);

	let chartViewport = $derived.by(() => {
		const { width: stageW, height: stageH } = stageSize;

		if (stageW <= 0 || stageH <= 0) {
			return { width: CHART.width, height: CHART.height, margin: DESKTOP_MARGIN };
		}

		return {
			width: Math.round(stageW),
			height: Math.round(stageH),
			margin: chartMargin
		};
	});

	let dotRadius = $derived(isDesktop ? 4 : 3.5);

	let scaleConfig = $derived({
		yearExtent: [frame.yearMin, frame.yearMax],
		yMax: frame.yMax
	});

	let xTicks = $derived(yearTicks(frame.yearMin, frame.yearMax));
	let yTicks = $derived(valueTicks(Y_TICK_STEP, Y_TICK_CEILING, frame.yMax));

	let layout = $derived(
		buildLinePath(scaleConfig, [{ year: frame.yearMin, value: 0 }], chartViewport)
	);

	let costSeries = $derived(
		collegeCost.series.map((s) => {
			const built = buildLinePath(scaleConfig, s.points, chartViewport);
			return { ...s, ...built };
		})
	);

	let earningsSeries = $derived(
		postCollegeEarnings.series.map((s) => {
			const built = buildLinePath(scaleConfig, s.points, chartViewport);
			const dots = (s.observed ?? []).map((p) => ({
				...p,
				cx: built.x(p.year),
				cy: built.y(p.value)
			}));
			return { ...s, ...built, dots };
		})
	);
</script>

<div class="mobility-chart">
	<div class="legend-host">
		<p class="legend-title" style:opacity={frame.legendOpacity}>Family income</p>
		<div class="legend-panel" style:opacity={frame.legendOpacity}>
			{#if showCostLegend}
				<ul class="legend">
					{#each costSeries as s (s.id)}
						<li class="legend-item">
							<svg class="legend-swatch" width="28" height="10" aria-hidden="true">
								<line x1="0" y1="5" x2="28" y2="5" stroke={s.color} stroke-width="3" />
							</svg>
							<span class="legend-label">{s.id}</span>
						</li>
					{/each}
				</ul>
			{:else}
				<ul class="legend">
					{#each earningsSeries as s (s.id)}
						<li class="legend-item">
							<svg class="legend-swatch" width="28" height="10" aria-hidden="true">
								<line x1="0" y1="5" x2="28" y2="5" stroke={s.color} stroke-width="3" />
							</svg>
							<span class="legend-label">{s.id}</span>
						</li>
					{/each}
				</ul>
			{/if}
		</div>
	</div>

	<div class="chart-stage" bind:this={chartStage}>
		<svg
			class="chart-svg"
			viewBox="0 0 {chartViewport.width} {chartViewport.height}"
			preserveAspectRatio="xMidYMid meet"
			role="img"
		>
		<g
			transform="translate({chartViewport.margin.left}, {chartViewport.margin.top})"
			opacity={frame.chromeOpacity}
		>
			{#each yTicks as tick}
				<g class="y-tick" transform="translate(0, {layout.y(tick)})">
					<line x1={0} x2={layout.innerW} class="grid-line" />
					<text x={-10} y={4} text-anchor="end" class="axis-label">{formatDollars(tick)}</text>
				</g>
			{/each}

			{#each xTicks as tick}
				<g class="x-tick" transform="translate({layout.x(tick)}, {layout.innerH})">
					<text y={22} text-anchor="middle" class="axis-label">{Math.round(tick)}</text>
				</g>
			{/each}

			<text
				x={layout.innerW / 2}
				y={layout.innerH + chartMargin.bottom - 5}
				text-anchor="middle"
				class="axis-title"
				opacity={1 - frame.yLabelMix}
			>
				{views.cost.xLabel}
			</text>
			<text
				x={layout.innerW / 2}
				y={layout.innerH + 42}
				text-anchor="middle"
				class="axis-title"
				opacity={frame.yLabelMix}
			>
				{views.earnings.xLabel}
			</text>

			<text
				transform="rotate(-90)"
				x={-layout.innerH / 2}
				y={-52}
				text-anchor="middle"
				class="axis-title"
				opacity={1 - frame.yLabelMix}
			>
				{views.cost.yLabel}
			</text>
			<text
				transform="rotate(-90)"
				x={-layout.innerH / 2}
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
							r={dotRadius}
							class="series-dot"
							fill={s.color}
							opacity={frame.dotsOpacity}
						/>
					{/each}
				</g>
			{/each}
		</g>
		</svg>
	</div>

	<p class="chart-source" style:opacity={frame.chromeOpacity}>{SOURCE}</p>
</div>

<style>
	.mobility-chart {
		width: 100%;
		max-width: 100%;
		overflow-x: clip;
		height: 100dvh;
		min-height: 100dvh;
		display: grid;
		grid-template-rows: auto minmax(0, 1fr) auto;
		background: var(--color-white);
	}

	.chart-stage {
		min-width: 0;
		min-height: 0;
		width: 100%;
		height: 100%;
	}

	.chart-svg {
		width: 100%;
		height: 100%;
		display: block;
	}

	.legend-host {
		padding: clamp(0.75rem, 2vw, 1.25rem) clamp(1rem, 3vw, 1.5rem) clamp(0.5rem, 1.5vw, 0.75rem);
	}

	.legend-title {
		margin: 1rem 0 0.5rem;
		text-align: center;
		font-size: clamp(0.9375rem, 2vw, 1.125rem);
		transition: opacity 280ms ease-in-out;
	}

	.legend-panel {
		transition: opacity 280ms ease-in-out;
	}

	.legend {
		list-style: none;
		margin: 0 auto;
		padding: 0;
		width: 100%;
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.375rem 0.75rem;
		justify-items: start;
	}

	.legend-item {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		font-size: clamp(0.8125rem, 2.2vw, 0.9375rem);
		min-width: 0;
	}

	.legend-label {
		white-space: nowrap;
	}

	.chart-source {
		padding: 0.5rem clamp(1rem, 3vw, 1.25rem) clamp(0.75rem, 2vw, 1rem);
		transition: opacity 0.15s linear;
	}

	.mobility-chart :global(.chart-svg .grid-line) {
		stroke-width: 1;
	}

	.mobility-chart :global(.chart-svg .series-line) {
		stroke-width: 2;
	}

	.mobility-chart :global(.chart-svg .series-dot) {
		stroke-width: 1.25;
	}

	.mobility-chart :global(.chart-svg .axis-label) {
		font-size: 12px;
	}

	.mobility-chart :global(.chart-svg .axis-title) {
		font-size: 13px;
	}

	@media (min-width: 540px) {
		.legend {
			gap: 0.5rem 3rem;
			display: flex;
		}
	}

	@media (min-width: 768px) {
		.legend {
			display: flex;
			flex-wrap: wrap;
			justify-content: center;
			gap: 0.5rem 3rem;
			justify-items: center;
		}

		.legend-item {
			gap: 0.5rem;
		}

		.mobility-chart :global(.chart-svg .grid-line) {
			stroke-width: 1;
		}

		.mobility-chart :global(.chart-svg .series-line) {
			stroke-width: 2.5;
		}

		.mobility-chart :global(.chart-svg .series-dot) {
			stroke-width: 1.5;
		}

		.mobility-chart :global(.chart-svg .axis-label) {
			font-size: 15px;
		}

		.mobility-chart :global(.chart-svg .axis-title) {
			font-size: 16px;
		}
	}
</style>
