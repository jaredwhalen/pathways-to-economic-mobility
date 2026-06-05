<script>
	import { publicOpinion } from '$lib/utils/parsePublicOpinion.js';

	let { active = false } = $props();

	const SOURCE =
		'Source: “Beyond Transfer: Insights from a Survey of American Adults.” Public Agenda, 2025';

	const COLORS = ['var(--color-orange)', 'var(--color-teal)'];

	let entered = $state(false);

	$effect(() => {
		if (active) entered = true;
	});

	let maxPct = $derived(
		Math.max(...publicOpinion.responses.map((response) => response.pct), 1)
	);

	let bars = $derived(
		publicOpinion.responses.map((response, i) => ({
			...response,
			color: COLORS[i] ?? 'var(--color-teal-light)',
			delay: i * 120,
			widthPct: (response.pct / maxPct) * 100
		}))
	);

	let ariaLabel = $derived(
		`${publicOpinion.question} ${publicOpinion.responses
			.map((response) => `${response.label} ${response.pct} percent`)
			.join('. ')}. ${SOURCE}`
	);
</script>

<figure class="opinion-chart" class:entered aria-label={ariaLabel}>
	<p class="chart-question">{publicOpinion.question}</p>

	<div class="bars" role="list">
		{#each bars as bar (bar.label)}
			<div class="bar-row" role="listitem">
				<span class="bar-label">{bar.label}</span>
				<div class="bar-track">
					<div
						class="bar-fill"
						style:--width="{bar.widthPct}%"
						style:--color={bar.color}
						style:--delay="{bar.delay}ms"
					></div>
				</div>
				<span class="bar-value">{bar.pct}%</span>
			</div>
		{/each}
	</div>

	<p class="chart-source">{SOURCE}</p>
</figure>

<style>
	.opinion-chart {
		margin: 1.25rem 0 0;
		padding: 1.25rem 0 0;
		border-top: 1px solid var(--color-teal-light);
	}

	.chart-question {
		margin: 0 0 1rem;
		font-family: var(--font-body);
		font-size: 0.8125rem;
		font-weight: var(--font-weight-regular);
		line-height: 1.45;
		color: var(--color-teal-dark);
	}

	.bars {
		display: flex;
		flex-direction: column;
		gap: 0.875rem;
	}

	.bar-row {
		display: grid;
		grid-template-columns: 1fr minmax(0, 2fr) auto;
		align-items: center;
		gap: 0.625rem;
	}

	.bar-label {
		font-family: var(--font-body);
		font-size: 0.75rem;
		line-height: 1.3;
		color: var(--color-navy);
	}

	.bar-track {
		height: 1.125rem;
	}

	.bar-fill {
		width: 0;
		height: 100%;
		background: var(--color);
		border-radius: 2px;
		transition: width 0.7s cubic-bezier(0.22, 1, 0.36, 1);
		transition-delay: var(--delay);
	}

	.opinion-chart.entered .bar-fill {
		width: var(--width);
	}

	.bar-value {
		font-family: var(--font-body);
		font-size: 0.8125rem;
		font-weight: var(--font-weight-regular);
		font-variant-numeric: tabular-nums;
		color: var(--color-teal-dark);
		min-width: 2.25rem;
		text-align: right;
	}

	.chart-source {
		margin: 1rem 0 0;
		font-family: var(--font-body);
		font-size: 0.6875rem;
		line-height: 1.45;
		color: var(--color-teal);
	}

	@media (max-width: 480px) {
		.bar-row {
			grid-template-columns: 1fr;
			gap: 0.375rem;
		}

		.bar-value {
			text-align: left;
		}
	}
</style>
