<script>
	let { index = 0, count = 0, offset = 0, visible = false, theme = 'light' } = $props();

	function segmentProgress(i) {
		if (i < index) return 1;
		if (i === index) return Math.min(1, Math.max(0, offset));
		return 0;
	}
</script>

{#if visible && count > 0}
	<div
		class="scroller-progress"
		class:theme-dark={theme === 'dark'}
		class:theme-light={theme === 'light'}
		role="group"
		aria-label="Slide progress"
	>
		{#each Array.from({ length: count }, (_, i) => i) as i (i)}
			<div class="scroller-progress-segment">
				<div
					class="scroller-progress-fill"
					style="transform: scaleX({segmentProgress(i)})"
				></div>
			</div>
		{/each}
	</div>
{/if}

<style>
	.scroller-progress {
		display: flex;
		gap: 0.25rem;
		padding: 0.75rem 1rem;
	}

	.scroller-progress-segment {
		flex: 1;
		height: 3px;
		border-radius: 1px;
		overflow: hidden;
	}

	.scroller-progress-fill {
		width: 100%;
		height: 100%;
		transform-origin: left center;
		will-change: transform;
	}

	.theme-dark .scroller-progress-segment {
		background: rgba(255, 255, 255, 0.25);
	}

	.theme-dark .scroller-progress-fill {
		background: var(--color-white);
	}

	.theme-light .scroller-progress-segment {
		background: rgba(49, 135, 147, 0.2);
	}

	.theme-light .scroller-progress-fill {
		background: var(--color-teal);
	}
</style>
