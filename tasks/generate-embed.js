#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, dirname, relative } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import projectConfig from '../src/lib/config/project.config.js';

const ROOT_PATH = join(__dirname, '..');
const DIST_PATH = join(ROOT_PATH, 'dist');
const INDEX_HTML_PATH = join(DIST_PATH, 'index.html');
const OUTPUT_PATH = join(ROOT_PATH, 'wordpress-embed.html');

const DEFAULT_CDN_BASE_URL = projectConfig.build.cdnBaseUrl.replace(/\/?$/, '/');
const EMBED_CONTAINER_ID = projectConfig.build.embedContainerId;

export function pinCdnBaseUrl(baseUrl, gitRef) {
	const normalized = baseUrl.replace(/\/?$/, '/');
	if (!gitRef) return normalized;
	return normalized.replace(/@[^/]+(?=\/)/, `@${gitRef}`);
}

function collectImmutableCss(distPath) {
	const assetsDir = join(distPath, '_app/immutable/assets');
	if (!existsSync(assetsDir)) return [];

	return readdirSync(assetsDir)
		.filter((file) => file.endsWith('.css'))
		.sort();
}

function collectImmutableJs(distPath) {
	const root = join(distPath, '_app/immutable');
	if (!existsSync(root)) return [];

	const files = [];

	function walk(dir, relDir) {
		for (const name of readdirSync(dir)) {
			const fullPath = join(dir, name);
			const relPath = relDir ? `${relDir}/${name}` : name;

			if (statSync(fullPath).isDirectory()) {
				walk(fullPath, relPath);
			} else if (name.endsWith('.js')) {
				files.push(relPath);
			}
		}
	}

	walk(root, '');
	return files.sort();
}

export function extractFileInfo(htmlContent, distPath = DIST_PATH) {
	const startMatch = htmlContent.match(/import\("\.\/_app\/immutable\/entry\/([^"]+\.js)"\)/);
	const appMatch = htmlContent.match(/import\("\.\/_app\/immutable\/entry\/([^"]+\.js)"\)/g);

	const startFile = startMatch ? startMatch[1] : null;
	const appFiles = appMatch
		? appMatch.map((m) => m.match(/import\("\.\/_app\/immutable\/entry\/([^"]+\.js)"\)/)[1])
		: [];
	const appFile = appFiles[appFiles.length - 1];

	const configMatch = htmlContent.match(/(__sveltekit_\w+)\s*=/);
	if (!configMatch) {
		throw new Error('Could not find SvelteKit configuration variable in dist/index.html');
	}

	return {
		cssFiles: collectImmutableCss(distPath),
		modulepreloadFiles: collectImmutableJs(distPath),
		startFile,
		appFile,
		configVar: configMatch[1]
	};
}

export function distAssetPaths(info, distPath = DIST_PATH) {
	const paths = [
		join(distPath, '_app/env.js'),
		...info.cssFiles.map((file) => join(distPath, '_app/immutable/assets', file)),
		join(distPath, '_app/immutable/entry', info.startFile),
		join(distPath, '_app/immutable/entry', info.appFile),
		...info.modulepreloadFiles.map((file) => join(distPath, '_app/immutable', file))
	];

	return [...new Set(paths.filter(Boolean))];
}

export function assertDistAssets(info, distPath = DIST_PATH) {
	const missing = distAssetPaths(info, distPath).filter((path) => !existsSync(path));

	if (missing.length) {
		const lines = missing.map((path) => `   - ${relative(ROOT_PATH, path)}`).join('\n');
		throw new Error(`dist/ is missing assets referenced by the embed:\n${lines}`);
	}
}

function containerAttributes() {
	const { mode, maxWidthPx, horizontalPadding } = projectConfig.layout;
	const styles = ['width:100%', 'box-sizing:border-box', `padding-inline:${horizontalPadding}`];
	if (mode === 'column') {
		styles.push(`max-width:${maxWidthPx}px`, 'margin-inline:0');
	}
	return `id="${EMBED_CONTAINER_ID}" class="full-bleed" style="${styles.join(';')}"`;
}

const EMBED_STYLES = `<style>
.full-bleed {
	width: 100vw;
	margin-left: calc(50% - 50vw);
	margin-right: calc(50% - 50vw);
}
</style>`;

export function generateEmbedHTML(info, cdnBaseUrl = DEFAULT_CDN_BASE_URL) {
	const { cssFiles, modulepreloadFiles, startFile, appFile, configVar } = info;
	const baseUrl = cdnBaseUrl.replace(/\/?$/, '/');

	return `<!-- WordPress embed bundle (see src/lib/config/project.config.js → build) -->
<!--
1. npm run publish
2. Paste this block into a Custom HTML block

CDN base: ${baseUrl}
-->

${EMBED_STYLES}

${cssFiles.map((file) => `<link href="${baseUrl}_app/immutable/assets/${file}" rel="stylesheet">`).join('\n\n')}

<link rel="modulepreload" href="${baseUrl}_app/env.js">
${modulepreloadFiles.map((file) => `<link rel="modulepreload" href="${baseUrl}_app/immutable/${file}">`).join('\n')}

<div ${containerAttributes()}>
	<div class="demo svelte-vfho01">
		<p>Loading…</p>
	</div>
</div>

<script>
(function () {
	const BASE_URL = "${baseUrl}";

	// Elementor runs pasted HTML in the editor before the live page is saved.
	if (typeof window.elementorFrontend !== 'undefined' && window.elementorFrontend.isEditMode?.()) {
		return;
	}

	const container = document.getElementById("${EMBED_CONTAINER_ID}");
	if (!container) return;

	window.${configVar} = { base: BASE_URL, assets: BASE_URL, env: null };

	import(BASE_URL + '_app/env.js')
		.then(({ env }) => {
			window.${configVar}.env = env;

			return Promise.all([
				import(BASE_URL + '_app/immutable/entry/${startFile}'),
				import(BASE_URL + '_app/immutable/entry/${appFile}')
			]);
		})
		.then(([kit, app]) => {
			kit.start(app, container, {
				node_ids: [0, 2],
				data: [null, null],
				form: null,
				error: null
			});
		})
		.catch((error) => {
			console.error('Svelte app failed to load:', error);
			container.innerHTML = '<p>Error loading app. Run npm run publish, then paste the updated wordpress-embed.html.</p>';
		});
})();
</script>`;
}

export function runGenerateEmbed({
	distPath = DIST_PATH,
	outputPath = OUTPUT_PATH,
	cdnBaseUrl = DEFAULT_CDN_BASE_URL,
	quiet = false
} = {}) {
	const indexHtmlPath = join(distPath, 'index.html');

	if (!existsSync(indexHtmlPath)) {
		throw new Error('dist/index.html not found. Run "npm run build" first.');
	}

	const htmlContent = readFileSync(indexHtmlPath, 'utf-8');
	const fileInfo = extractFileInfo(htmlContent, distPath);

	if (!fileInfo.cssFiles.length || !fileInfo.startFile || !fileInfo.appFile) {
		throw new Error('Could not extract embed asset paths from dist/index.html');
	}

	assertDistAssets(fileInfo, distPath);

	const embedHTML = generateEmbedHTML(fileInfo, cdnBaseUrl);
	writeFileSync(outputPath, embedHTML);

	if (!quiet) {
		console.log('✅ wordpress-embed.html written');
		console.log(`   CDN: ${cdnBaseUrl.replace(/\/?$/, '/')}`);
		console.log(`   Container: #${EMBED_CONTAINER_ID}`);
		console.log(`   Assets checked: ${distAssetPaths(fileInfo, distPath).length}`);
	}

	return fileInfo;
}

function main() {
	console.log('🔍 Checking for dist/index.html...');

	try {
		runGenerateEmbed();
		console.log('📦 Run "npm run publish" to push dist/, docs/, and wordpress-embed.html.');
	} catch (error) {
		console.error(`❌ ${error.message}`);
		process.exit(1);
	}
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
	main();
}
