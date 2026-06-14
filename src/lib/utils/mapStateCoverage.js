import opportunityCsv from '$lib/data/CCIHEOpportunityCollegeandUniversities.csv';
import { parseGeocodedSites } from '$lib/utils/parseMapSites.js';

export function buildStatesWithoutOpportunitySchools(mapStates) {
	const statesWithSchools = new Set(parseGeocodedSites(opportunityCsv).map((site) => site.state));

	return new Set(
		mapStates.map((state) => state.id).filter((name) => !statesWithSchools.has(name))
	);
}
