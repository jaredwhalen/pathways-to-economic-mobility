<script>
	import { assetUrl } from '$lib/utils/assetUrl.js';

	const photoUrl = assetUrl('/images/completion-uc-merced-graduation.webp');
</script>

<div class="completion-photo" style={`--photo-url: url('${photoUrl}')`} role="presentation"></div>

<style>
	.completion-photo {
		width: 100%;
		height: 100dvh;
		min-height: 100dvh;
		background-color: var(--section-bg-dark);
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
			),
			var(--photo-url);
		background-size: cover;
		background-position: center 35%;
		background-repeat: no-repeat;
	}
</style>
