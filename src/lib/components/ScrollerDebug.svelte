<script>
	let { index = 0, count = 0, progress = 0, offset = 0, visible = false } = $props();

	let slideLabel = $derived(count > 0 ? `${index + 1} / ${count}` : '—');
	let progressLabel = $derived(progress.toFixed(3));
	let offsetLabel = $derived(offset.toFixed(3));
</script>

<div class="scroller-debug" aria-hidden="true">
	<div class="row">
		<span class="label">Slide</span>
		<span class="value">{slideLabel}</span>
	</div>
	<div class="row">
		<span class="label">Progress</span>
		<span class="value">{progressLabel}</span>
	</div>
	<div class="row">
		<span class="label">Offset</span>
		<span class="value">{offsetLabel}</span>
	</div>
	<div class="row">
		<span class="label">Visible</span>
		<span class="value">{visible ? 'yes' : 'no'}</span>
	</div>
</div>

<style>
	.scroller-debug {
		position: fixed;
		right: 0.75rem;
		bottom: 0.75rem;
		z-index: 9999;
		pointer-events: none;
		font-family: ui-monospace, 'SF Mono', Menlo, monospace;
		font-size: 0.6875rem;
		line-height: 1.4;
		color: #f3f3f3;
		background: rgba(3, 31, 67, 0.88);
		border: 1px solid rgba(152, 195, 201, 0.4);
		border-radius: 0.375rem;
		padding: 0.5rem 0.625rem;
		min-width: 7.5rem;
		backdrop-filter: blur(4px);
	}

	.row {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
	}

	.label {
		color: rgba(152, 195, 201, 0.9);
	}

	.value {
		font-variant-numeric: tabular-nums;
	}
</style>
