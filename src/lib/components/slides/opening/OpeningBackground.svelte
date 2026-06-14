<script>
	import { assetUrl } from '$lib/utils/assetUrl.js';

	
	let { isActive = false } = $props();

	const videoSrc = assetUrl('/video/background.mp4');

	let videoEl = $state( (null));

	$effect(() => {
		if (!videoEl) return;

		if (isActive) {
			void videoEl.play();
		} else {
			videoEl.pause();
		}
	});
</script>

<div class="opening-video" role="presentation">
	<video
		bind:this={videoEl}
		class="opening-video-media"
		src={videoSrc}
		muted
		loop
		playsinline
		preload="metadata"
		aria-hidden="true"
	></video>
	<div class="opening-video-overlay" aria-hidden="true"></div>
</div>

<style>
	.opening-video {
		position: relative;
		width: 100%;
		height: 100dvh;
		min-height: 100dvh;
		overflow: hidden;
		background-color: var(--section-bg-dark);
	}

	.opening-video-media {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		object-position: center;
	}

	.opening-video-overlay {
		position: absolute;
		inset: 0;
		background-image: linear-gradient(
			180deg,
			rgba(25, 68, 74, 0.55) 0%,
			rgba(25, 68, 74, 0.82) 45%,
			rgba(3, 31, 67, 0.92) 100%
		);
		pointer-events: none;
	}
</style>
