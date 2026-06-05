/** Semantic highlight tokens aligned with chart / background visuals. */
export const HIGHLIGHT_TOKENS = {
	orange: 'highlight-orange',
	teal: 'highlight-teal',
	yellow: 'highlight-yellow',
	purple: 'highlight-purple',
	campus: 'highlight-teal',
	community: 'highlight-yellow',
	economy: 'highlight-purple',
	leadership: 'highlight-purple',
	'frontline-staff': 'highlight-teal',
	'region-gray': 'highlight-gray',
	'empty-region': 'highlight-gray'
};

const HIGHLIGHT_RE = /\[\[([a-z-]+)\]\]([\s\S]*?)\[\[\/\]\]/g;

/** @param {string} value */
function escapeHtml(value) {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

/**
 * @param {string} text
 */
export function formatSlideParagraph(text) {
	let result = '';
	let lastIndex = 0;

	for (const match of text.matchAll(HIGHLIGHT_RE)) {
		const index = match.index ?? 0;
		result += escapeHtml(text.slice(lastIndex, index));

		const token = match[1];
		const inner = escapeHtml(match[2]);
		const className = HIGHLIGHT_TOKENS[/** @type {keyof typeof HIGHLIGHT_TOKENS} */ (token)];

		if (className) {
			result += `<span class="text-highlight ${className}">${inner}</span>`;
		} else {
			result += inner;
		}

		lastIndex = index + match[0].length;
	}

	result += escapeHtml(text.slice(lastIndex));
	return result;
}
