<script>
	import {
		CHART,
		buildLinePath,
		yearTicks,
		valueTicks,
		formatDollars,
		drawLine
	} from '$lib/utils/chartLayout.js';

	

	
	let { config, animate = false, showDots = false, visible = true } = $props();

	const { width, height, margin } = CHART;
	const innerW = width - margin.left - margin.right;
	const innerH = height - margin.top - margin.bottom;

	let xTicks = $derived(yearTicks(config.yearExtent[0], config.yearExtent[1], 2));
	let yTicks = $derived(valueTicks(config.yMax, config.yMax / 4));

	let layout = $derived.by(() => {
		const sample = config.series[0]?.points ?? [];
		const base = buildLinePath(config, sample);
		return base;
	});

	let seriesPaths = $derived(
		config.series.map((s) => ({
			...s,
			...buildLinePath(config, s.points),
			dots: (s.observed ?? s.points).map((p) => ({
				...p,
				cx: layout.x(p.year),
				cy: layout.y(p.value)
			}))
		}))
	);
</script>

<div class="line-chart" class:visible aria-hidden={!visible}>
	<div class="chart-header">{config.title}</div>

	<svg class="chart-svg" viewBox="0 0 {width} {height}" role="img">
		<g transform="translate({margin.left}, {margin.top})">
			{#each yTicks as tick}
				<g class="y-tick" transform="translate(0, {layout.y(tick)})">
					<line x1={0} x2={innerW} class="grid-line" />
					<text x={-10} y={4} text-anchor="end" class="axis-label">{formatDollars(tick)}</text>
				</g>
			{/each}

			{#each xTicks as tick}
				<g class="x-tick" transform="translate({layout.x(tick)}, {innerH})">
					<text y={22} text-anchor="middle" class="axis-label">{tick}</text>
				</g>
			{/each}

			<text
				x={innerW / 2}
				y={innerH + 52}
				text-anchor="middle"
				class="axis-title"
			>
				Year
			</text>

			<text
				transform="rotate(-90)"
				x={-innerH / 2}
				y={-52}
				text-anchor="middle"
				class="axis-title"
			>
				{config.yLabel}
			</text>

			{#each seriesPaths as s (s.id)}
				<path
					d={s.path}
					class="series-line"
					stroke={s.color}
					stroke-dasharray={s.dash || undefined}
					use:drawLine={{ animate }}
				/>
				{#if showDots}
					{#each s.dots as dot (dot.year)}
						<circle
							cx={dot.cx}
							cy={dot.cy}
							r={4}
							class="series-dot"
							fill={s.color}
						/>
					{/each}
				{/if}
			{/each}
		</g>
	</svg>

	<ul class="legend">
		{#each config.series as s (s.id)}
			<li class="legend-item">
				<svg class="legend-swatch" width="18" height="8" aria-hidden="true">
					<line
						x1="0"
						y1="4"
						x2="18"
						y2="4"
						stroke={s.color}
						stroke-width="2.5"
						stroke-dasharray={s.dash || undefined}
					/>
				</svg>
				<span class="legend-label">{s.id}</span>
			</li>
		{/each}
	</ul>

	<p class="chart-source">{config.source}</p>
</div>

<style>
	.line-chart {
		width: 100%;
		height: 100%;
		min-height: 100dvh;
		display: flex;
		flex-direction: column;
		background: var(--color-white);
		opacity: 0;
		transition: opacity 0.45s ease;
		pointer-events: none;
	}

	.line-chart.visible {
		opacity: 1;
	}

	.chart-header {
		flex-shrink: 0;
		padding: 0.625rem 1.25rem;
		font-family: var(--font-body);
		font-size: 0.9375rem;
		font-weight: var(--font-weight-regular);
		color: var(--color-white);
		background: var(--color-teal);
	}

	.chart-svg {
		flex: 1 1 auto;
		width: 100%;
		min-height: 0;
		display: block;
	}

	.legend {
		list-style: none;
		margin: 0;
		padding: 0.75rem 1.25rem;
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.75rem 1.25rem;
		border-top: 1px solid #eee;
	}

	.legend-item {
		gap: 0.4rem;
		font-size: 0.6875rem;
	}

	.chart-source {
		padding: 0 1.25rem 1rem;
	}
</style>
