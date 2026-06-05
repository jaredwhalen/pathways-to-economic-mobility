import csv from '$lib/data/post-college-earnings.csv';

export const EARNINGS_GROUPS = ['$0-30k', '$30-75k', '$75k+'];

export const EARNINGS_STYLES = {
	'$0-30k': { color: '#de6a40' },
	'$30-75k': { color: '#318793' },
	'$75k+': { color: '#38aad6' }
};

/**
 * Linear interpolation between observed years for a smooth line;
 * observed years are returned separately for dot markers.
 * @param {{ year: number, value: number }[]} points
 */
export function interpolateSeries(points) {
	const sorted = [...points].sort((a, b) => a.year - b.year);
	if (!sorted.length) return { line: [], observed: [] };

	const minYear = sorted[0].year;
	const maxYear = sorted[sorted.length - 1].year;
	const line = [];

	for (let year = minYear; year <= maxYear; year++) {
		const exact = sorted.find((p) => p.year === year);
		if (exact) {
			line.push({ year, value: exact.value });
			continue;
		}

		const nextIdx = sorted.findIndex((p) => p.year > year);
		const prev = sorted[nextIdx - 1];
		const next = sorted[nextIdx];
		const t = (year - prev.year) / (next.year - prev.year);
		line.push({ year, value: prev.value + t * (next.value - prev.value) });
	}

	return { line, observed: sorted };
}

/** @param {string | number} raw */
function parseEarnings(raw) {
	return parseFloat(String(raw).replace(/[",]/g, ''));
}

/** @param {Record<string, string>[]} rows */
export function parsePostCollegeEarnings(rows) {
	/** @type {Map<string, { year: number, value: number }[]>} */
	const seriesMap = new Map(EARNINGS_GROUPS.map((group) => [group, []]));
	const years = new Set();

	for (const row of rows) {
		const year = Number(row.year);
		const group = row.income_group;
		const value = parseEarnings(row.mean_earnings);
		if (!group || Number.isNaN(year) || Number.isNaN(value)) continue;

		years.add(year);
		if (!seriesMap.has(group)) seriesMap.set(group, []);
		seriesMap.get(group).push({ year, value });
	}

	const sortedYears = [...years].sort((a, b) => a - b);

	const series = EARNINGS_GROUPS.map((id) => {
		const observed = (seriesMap.get(id) ?? []).sort((a, b) => a.year - b.year);
		const { line, observed: dots } = interpolateSeries(observed);
		return {
			id,
			points: line,
			observed: dots,
			...EARNINGS_STYLES[id]
		};
	});

	return {
		series,
		years: sortedYears,
		yearExtent: [sortedYears[0], sortedYears[sortedYears.length - 1]],
		yMax: 80000,
		yLabel: 'Mean Earnings (2022 $)',
		title: 'Post-college earnings',
		source: 'Source: U.S. Department of Education College Scorecard'
	};
}

export const postCollegeEarnings = parsePostCollegeEarnings(csv);

export default postCollegeEarnings;
