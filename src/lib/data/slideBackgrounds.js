import OpeningBackground from '$lib/components/slides/opening/OpeningBackground.svelte';
import MobilityChartBackground from '$lib/components/slides/mobility-chart/MobilityChartBackground.svelte';
import MapBackground from '$lib/components/slides/map/MapBackground.svelte';
import OpenDoorsBackground from '$lib/components/slides/open-doors/OpenDoorsBackground.svelte';
import CompletionBackground from '$lib/components/slides/completion/CompletionBackground.svelte';
import RegionalReciprocityBackground from '$lib/components/slides/regional-reciprocity/RegionalReciprocityBackground.svelte';
import CultureOfSuccessBackground from '$lib/components/slides/culture-of-success/CultureOfSuccessBackground.svelte';
import AascuPartnershipBackground from '$lib/components/slides/aascu-partnership/AascuPartnershipBackground.svelte';
import { slides } from '$lib/data/copy.js';

export const BACKGROUND_LAYERS = [
	{
		id: 'opening',
		slideIds: ['opening', 'opening-trust'],
		theme: 'dark',
		component: OpeningBackground
	},
	{
		id: 'mobility-chart',
		slideIds: ['college-cost', 'earnings-inequality'],
		theme: 'light',
		component: MobilityChartBackground
	},
	{
		id: 'map',
		slideIds: ['regional-opportunity', 'public-agenda'],
		theme: 'light',
		component: MapBackground
	},
	{ id: 'open-doors', slideIds: ['open-doors'], theme: 'dark', component: OpenDoorsBackground },
	{ id: 'completion', slideIds: ['completion'], theme: 'dark', component: CompletionBackground },
	{
		id: 'regional-reciprocity',
		slideIds: ['regional-reciprocity'],
		theme: 'light',
		component: RegionalReciprocityBackground
	},
	{
		id: 'culture-of-success',
		slideIds: ['culture-of-success'],
		theme: 'light',
		component: CultureOfSuccessBackground
	},
	{
		id: 'aascu-partnership',
		slideIds: ['aascu-partnership'],
		theme: 'dark',
		component: AascuPartnershipBackground
	}
];

export const SLIDES_WITH_BACKGROUNDS = new Set(
	BACKGROUND_LAYERS.flatMap((layer) => layer.slideIds)
);

export function getBackgroundIdForSlide(slideId) {
	const slide = slides.find((entry) => entry.id === slideId);
	return slide?.background ?? null;
}

export function getSlideTheme(slideId) {
	const layer = BACKGROUND_LAYERS.find((entry) => entry.slideIds.includes(slideId));
	return layer?.theme ?? 'light';
}
