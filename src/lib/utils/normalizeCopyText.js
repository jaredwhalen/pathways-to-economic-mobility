const MOJIBAKE_RE = /(?:Ã[\u0080-\u00BF]|â[\u0080-\u00BF]{1,2}|â€.)/;

const UNICODE_TO_HTML_ENTITY = [
	['\u2014', '&#8212;'],
	['\u2013', '&#8211;'],
	['\u2018', '&#8216;'],
	['\u2019', '&#8217;'],
	['\u201C', '&#8220;'],
	['\u201D', '&#8221;'],
	['\u2026', '&#8230;']
];

/**
 * Repair UTF-8 text that was mis-decoded as Latin-1 (e.g. â€" instead of —).
 */
export function fixUtf8Mojibake(text) {
	if (!text || typeof text !== 'string' || !MOJIBAKE_RE.test(text)) return text;

	const bytes = Uint8Array.from(text, (char) => char.charCodeAt(0) & 0xff);
	const repaired = new TextDecoder('utf-8', { fatal: false }).decode(bytes);

	if (repaired !== text && !repaired.includes('\uFFFD')) return repaired;
	return text;
}

/**
 * Encode typographic punctuation as ASCII HTML entities for {@html} output.
 * Avoids mojibake when the host page does not declare UTF-8 (e.g. WordPress embed).
 */
export function unicodePunctuationToHtmlEntities(text) {
	if (!text || typeof text !== 'string') return text;

	let result = text;
	for (const [char, entity] of UNICODE_TO_HTML_ENTITY) {
		result = result.split(char).join(entity);
	}
	return result;
}

export function normalizeCopyStrings(value) {
	if (typeof value === 'string') return fixUtf8Mojibake(value);
	if (Array.isArray(value)) return value.map(normalizeCopyStrings);
	if (value && typeof value === 'object') {
		return Object.fromEntries(
			Object.entries(value).map(([key, entry]) => [key, normalizeCopyStrings(entry)])
		);
	}
	return value;
}
