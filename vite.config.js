import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import dsv from '@rollup/plugin-dsv';

function hashStaticAssets(staticDir) {
	/** @type {Record<string, string>} */
	const hashes = {};

	function walk(dir) {
		for (const name of readdirSync(dir)) {
			const fullPath = join(dir, name);
			if (statSync(fullPath).isDirectory()) {
				walk(fullPath);
				continue;
			}

			const assetPath = `/${relative(staticDir, fullPath).replace(/\\/g, '/')}`;
			const hash = createHash('md5').update(readFileSync(fullPath)).digest('hex').slice(0, 8);
			hashes[assetPath] = hash;
		}
	}

	walk(staticDir);
	return hashes;
}

const staticDir = join(process.cwd(), 'static');

export default defineConfig({
	envPrefix: ['PUBLIC_', 'MAPBOX_'],
	define: {
		__STATIC_ASSET_HASHES__: JSON.stringify(hashStaticAssets(staticDir))
	},
	plugins: [sveltekit(), dsv()]
});
