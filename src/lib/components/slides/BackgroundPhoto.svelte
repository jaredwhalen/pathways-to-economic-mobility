<script>
	import { assetUrl } from '$lib/utils/assetUrl.js';

	let { src, position = 'center center' } = $props();

	const photoUrl = $derived(assetUrl(src));
</script>

<div class="background-photo" role="presentation">
	<div
		class="background-photo-layer"
		style:--photo-url={`url('${photoUrl}')`}
		style:--photo-position={position}
	></div>
	<div class="background-photo-overlay" aria-hidden="true"></div>
</div>

<style>
	.background-photo {
		position: relative;
		width: 100%;
		height: 100dvh;
		min-height: 100dvh;
		overflow: hidden;
		background-color: var(--section-bg-dark);
	}

	.background-photo-layer {
		position: absolute;
		inset: 0;
		background-image: var(--photo-url);
		background-size: cover;
		background-position: var(--photo-position);
		background-repeat: no-repeat;
	}

	.background-photo-overlay {
		position: absolute;
		inset: 0;
		background-image:
			linear-gradient(
				180deg,
				rgba(25, 68, 74, 0.72) 0%,
				rgba(25, 68, 74, 0.35) 28%,
				rgba(25, 68, 74, 0.1) 52%,
				rgba(3, 31, 67, 0.55) 78%,
				rgba(3, 31, 67, 0.92) 100%
			),
			radial-gradient(
				ellipse 90% 80% at 50% 42%,
				transparent 0%,
				rgba(25, 31, 47, 0.45) 55%,
				rgba(3, 31, 67, 0.82) 100%
			);
		pointer-events: none;
	}
</style>
