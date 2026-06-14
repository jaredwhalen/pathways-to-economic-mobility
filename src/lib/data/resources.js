const RESOURCE_SITE_BASE = 'https://publicagenda.org';

export const resources = [
	{
		id: 'overview',
		title: 'Overview',
		description:
			'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
		path: '/resource/emcs/',
		thumbnail: '/images/public-agenda-engagement.webp',
		placement: 'center'
	},
	{
		id: 'case-studies',
		title: 'Case Studies',
		description:
			'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
		path: '/resource/emcs/case-studies/',
		thumbnail: '/images/problem-campus.webp',
		placement: 'left'
	},
	{
		id: 'case-study-themes',
		title: 'Case Study Themes',
		description:
			'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
		path: '/resource/emcs/thematic-analysis/',
		thumbnail: '/images/community.webp',
		placement: 'right'
	},
	{
		id: 'quantitative-research',
		title: 'Quantitative Research',
		description:
			'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
		path: '/resource/emcs/quantitative-research/',
		thumbnail: '/images/completion-uc-merced-graduation.webp',
		placement: 'left'
	},
	{
		id: 'planning-guide',
		title: 'Planning Guide',
		description:
			'Curabitur blandit tempus porttitor. Maecenas sed diam eget risus varius blandit sit amet non magna.',
		path: '/resource/emcs/planning-guide/',
		thumbnail: '/images/reduce-barriers-community.webp',
		placement: 'right'
	}
];

export function getResourceUrl(path) {
	return new URL(path, RESOURCE_SITE_BASE).href;
}
