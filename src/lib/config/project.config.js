// Lives under src/ so Vite can import it in dev without fs restrictions.

const project = {
	meta: {
		title: 'YOUR_DISPLAY_TITLE', // <title> (npm run setup)
		description: "YOUR_META_DESCRIPTION", // meta description (npm run setup)
	},

	document: {
		mode: 'standalone', // 'standalone' | 'inline' — inline skips Google Fonts (host owns typography)
		includeViewportMeta: true,
		includeGoogleFonts: true, // only when mode is standalone
		googleFontHref:
			'https://fonts.googleapis.com/css2?family=Merriweather:ital,wght@0,400;0,700;1,400&family=Roboto:ital,wght@0,300;0,400;1,300&display=swap'
	},

	layout: {
		mode: 'full', // 'column' | 'full' — column: max-width + flush start; full: no max-width on app root
		maxWidthPx: 800, // used when mode is 'column'
		horizontalPadding: '0'
	},

	build: {
		cdnBaseUrl: 'https://cdn.jsdelivr.net/gh/YOUR_GITHUB_ORG/YOUR_GITHUB_REPO@main/dist/', // published dist/ base; used by tasks/generate-embed.js (npm run setup)
		embedContainerId: 'svelte-app-container' // DOM id for the WordPress embed mount node
	}
};

export default project;
