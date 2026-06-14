// Lives under src/ so Vite can import it in dev without fs restrictions.

const project = {
	meta: {
		title: 'Pathways to Economic Mobility',
		description:
			'An interactive story on economic mobility, higher education access, and Public Agenda research.'
	},

	document: {
		mode: 'inline', // WordPress host owns page meta, typography, and favicon
		includeViewportMeta: true, // standalone only; inline embed leaves these to the host page
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
		cdnBaseUrl:
			'https://cdn.jsdelivr.net/gh/jaredwhalen/pathways-to-economic-mobility@main/dist/',
		embedContainerId: 'svelte-app-container' // DOM id for the WordPress embed mount node
	}
};

export default project;
