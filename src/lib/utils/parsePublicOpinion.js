import csv from '$lib/data/public-opinion.csv';

/**
 * @typedef {{ label: string, pct: number }} OpinionResponse
 * @typedef {{ question: string, responses: OpinionResponse[] }} PublicOpinion
 */

/** @param {Record<string, string>[]} rows */
export function parsePublicOpinion(rows) {
	if (!rows?.length) {
		return { question: '', responses: [] };
	}

	const keys = Object.keys(rows[0]);
	const questionKey = keys[0];
	const valueKey = keys.find((key) => key !== questionKey) ?? keys[1];
	const question = questionKey;

	const responses = rows
		.map((row) => {
			const label = String(row[questionKey] ?? '').trim();
			const raw = String(row[valueKey] ?? '0').trim();
			const pct = parseFloat(raw.replace('%', ''));
			return { label, pct };
		})
		.filter((response) => response.label.length > 0 && !Number.isNaN(response.pct));

	return { question, responses };
}

/** @type {PublicOpinion} */
export const publicOpinion = parsePublicOpinion(csv);

export default publicOpinion;
