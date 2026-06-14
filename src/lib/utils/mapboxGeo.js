import opportunityCsv from '$lib/data/CCIHEOpportunityCollegeandUniversities.csv';
import caseStudyCsv from '$lib/data/case_study_sites.csv';
import usStates from '$lib/data/us-states.json';
import { parseGeocodedSites } from '$lib/utils/parseMapSites.js';
import { buildStatesWithoutOpportunitySchools } from '$lib/utils/mapStateCoverage.js';

const opportunityParsed = parseGeocodedSites(opportunityCsv);
const caseStudyParsed = parseGeocodedSites(caseStudyCsv);

// Golden-ratio sequence: deterministic but evenly spread, so staggered
// entrances look organic rather than sweeping across the list order.
const GOLDEN_RATIO = 0.61803398875;

function toPointFeature(site, index) {
	return {
		type: 'Feature',
		geometry: {
			type: 'Point',
			coordinates: [site.lon, site.lat]
		},
		properties: {
			key: site.key,
			name: site.id,
			state: site.state,
			stagger: (index * GOLDEN_RATIO) % 1
		}
	};
}

export function sitesToFeatureCollection(sites) {
	return {
		type: 'FeatureCollection',
		features: sites.map(toPointFeature)
	};
}

export const opportunitySitesGeo = opportunityParsed;
export const caseStudySitesGeo = caseStudyParsed;
export const caseStudyStateIds = [...new Set(caseStudyParsed.map((site) => site.state))];

const statesWithoutOpportunity = buildStatesWithoutOpportunitySchools(
	usStates.features.map((feature) => ({
		id: feature.properties?.name ?? ''
	}))
);

export function buildStatesGeoJson(slideId) {
	return {
		type: 'FeatureCollection',
		features: usStates.features.map((feature) => {
			const name = feature.properties?.name ?? '';
			let fillTier = 'active';

			if (slideId === 'public-agenda') {
				fillTier = caseStudyStateIds.includes(name) ? 'active' : 'muted';
			} else {
				fillTier = statesWithoutOpportunity.has(name) ? 'muted' : 'active';
			}

			return {
				...feature,
				properties: {
					...feature.properties,
					fillTier
				}
			};
		})
	};
}

export function siteLngLat(site) {
	return  ([site.lon, site.lat]);
}
