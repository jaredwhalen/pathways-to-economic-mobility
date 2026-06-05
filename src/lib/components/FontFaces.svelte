<script>
	import { assetUrl } from '$lib/utils/assetUrl.js';

	const fontFacesCss = `
@font-face {
	font-family: 'freight-display-pro';
	src: url('${assetUrl('/fonts/FeatureDisplay-Medium-Web.woff2')}') format('woff2');
	font-weight: 500;
	font-style: normal;
	font-display: swap;
}

@font-face {
	font-family: 'founders-grotesk';
	src: url('${assetUrl('/fonts/FoundersGrotesk-Regular.otf')}') format('opentype');
	font-weight: 400;
	font-style: normal;
	font-display: swap;
}

@font-face {
	font-family: 'founders-grotesk';
	src: url('${assetUrl('/fonts/founders-grotesk-semibold.woff2')}') format('woff2');
	font-weight: 600;
	font-style: normal;
	font-display: swap;
}`;
</script>

<svelte:head>
	{@html `<style>${fontFacesCss}</style>`}
</svelte:head>
