import opportunityCsv from '$lib/data/CCIHEOpportunityCollegeandUniversities.csv';
import caseStudyCsv from '$lib/data/case_study_sites.csv';
import statesGeo from '$lib/data/gz_2010_us_040_00_500k.json';
import { parseGeocodedSites } from '$lib/utils/parseMapSites.js';
import { buildMapLayout, projectSites } from '$lib/utils/mapLayout.js';
import { buildStatesWithoutOpportunitySchools } from '$lib/utils/mapStateCoverage.js';

const caseStudyParsed = parseGeocodedSites(caseStudyCsv);
const layout = buildMapLayout(statesGeo);

export const mapStates = layout.states;
export const mapSize = { width: layout.width, height: layout.height };

export const opportunitySites = projectSites(layout, parseGeocodedSites(opportunityCsv));
export const caseStudySites = projectSites(layout, caseStudyParsed);
export const caseStudyStateIds = [...new Set(caseStudyParsed.map((site) => site.state))];
export const caseStudyHighlightStates = mapStates.filter((state) =>
	caseStudyStateIds.includes(state.id)
);

/** States with zero CCIHE opportunity colleges in the source data. */
export const statesWithoutOpportunitySchools = buildStatesWithoutOpportunitySchools(mapStates);

export { layout as mapLayout };
