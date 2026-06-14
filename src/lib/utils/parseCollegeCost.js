import csv from '$lib/data/college-cost.csv';

export const COLLEGE_COST_GROUPS = [
	'$0-30k',
	'$30-48k',
	'$48-75k',
	'$75-110k',
	'$110k+'
];

export const COLLEGE_COST_STYLES = {
	'$0-30k': { color: '#de6a40' },
	'$30-48k': { color: '#5bb785' },
	'$48-75k': { color: '#318793' },
	'$75-110k': { color: '#38aad6' },
	'$110k+': { color: '#b34cdb' }
};

export function parseCollegeCost(rows) {
	
	const seriesMap = new Map(COLLEGE_COST_GROUPS.map((group) => [group, []]));
	const years = new Set();

	for (const row of rows) {
		const year = Number(row.academic_year);
		const group = row.income_group;
		const value = Number(row.net_price);
		if (!group || Number.isNaN(year) || Number.isNaN(value)) continue;

		years.add(year);
		if (!seriesMap.has(group)) seriesMap.set(group, []);
		seriesMap.get(group).push({ year, value });
	}

	const sortedYears = [...years].sort((a, b) => a - b);

	const series = COLLEGE_COST_GROUPS.map((id) => ({
		id,
		points: (seriesMap.get(id) ?? []).sort((a, b) => a.year - b.year),
		...COLLEGE_COST_STYLES[id]
	}));

	return {
		series,
		years: sortedYears,
		yearExtent: [sortedYears[0], sortedYears[sortedYears.length - 1]],
		yMax: 40000,
		yLabel: 'Annual Net Price (2022 $)',
		title: '4-year public',
		source: 'Source: U.S. Department of Education College Scorecard'
	};
}

export const collegeCost = parseCollegeCost(csv);

export default collegeCost;
