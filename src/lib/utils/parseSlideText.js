import { unicodePunctuationToHtmlEntities } from './normalizeCopyText.js';

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
const ALIGN_RE = /\[\[align\]\]([\s\S]*?)\[\[\/\]\]/i;
const ALLOWED_INLINE_TAG_RE = /<\/?(?:b|strong|i|em)\b[^>]*>/gi;
const ALIGN_DELIMITER = '|';

function formatPhraseList(phrases) {
	if (phrases.length <= 1) return phrases[0] ?? '';
	if (phrases.length === 2) return `${phrases[0]} and ${phrases[1]}`;
	return `${phrases.slice(0, -1).join(', ')}, and ${phrases.at(-1)}`;
}

/**
 * Extract animated align-list content from slide copy.
 * Syntax: [[align]]student support|advising|data-use[[/]]
 */
export function parseAlignSlide(text) {
	if (!text) return null;

	const match = text.match(ALIGN_RE);
	if (!match || match.index === undefined) return null;

	const textLead = text.slice(0, match.index).trim();
	const textTail = text.slice(match.index + match[0].length).trim();
	const alignPhrases = match[1]
		.split(ALIGN_DELIMITER)
		.map((phrase) => phrase.trim())
		.filter((phrase) => phrase.length > 0);

	if (!alignPhrases.length) return null;

	const srText = [textLead, formatPhraseList(alignPhrases), textTail]
		.filter(Boolean)
		.join(' ')
		.replace(/\s+/g, ' ')
		.trim();

	return { textLead, alignPhrases, textTail, srText };
}

function escapeHtml(value) {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

function protectAllowedTags(text) {
	const placeholders = [];

	const protectedText = text.replace(ALLOWED_INLINE_TAG_RE, (tag) => {
		const token = `\x00HTML${placeholders.length}\x00`;
		placeholders.push(tag);
		return token;
	});

	return {
		text: protectedText,
		restore(value) {
			return value.replace(/\x00HTML(\d+)\x00/g, (_, index) => placeholders[Number(index)] ?? '');
		}
	};
}

export function formatSlideParagraph(text) {
	const { text: input, restore } = protectAllowedTags(text);
	let result = '';
	let lastIndex = 0;

	for (const match of input.matchAll(HIGHLIGHT_RE)) {
		const index = match.index ?? 0;
		result += escapeHtml(input.slice(lastIndex, index));

		const token = match[1];
		const inner = escapeHtml(match[2]);
		const className = HIGHLIGHT_TOKENS[token];

		if (className) {
			result += `<span class="text-highlight ${className}">${inner}</span>`;
		} else {
			result += inner;
		}

		lastIndex = index + match[0].length;
	}

	result += escapeHtml(input.slice(lastIndex));
	return unicodePunctuationToHtmlEntities(restore(result));
}
