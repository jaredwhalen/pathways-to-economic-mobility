#!/usr/bin/env node

import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const PURGE_URL = 'https://purge.jsdelivr.net/';
const BATCH_SIZE = 30;

export function cdnBaseToPurgePrefix(cdnBaseUrl) {
	const match = cdnBaseUrl.match(/cdn\.jsdelivr\.net\/gh\/([^/]+\/[^@]+@[^/]+)(\/.*)?$/);
	if (!match) {
		throw new Error(`Cannot parse jsDelivr CDN base URL for purge: ${cdnBaseUrl}`);
	}

	const subpath = (match[2] ?? '').replace(/\/$/, '');
	return `/gh/${match[1]}${subpath}`;
}

export function collectPurgePaths(distPath, purgePrefix) {
	const paths = [];

	function walk(dir, relDir = '') {
		for (const name of readdirSync(dir)) {
			if (name === '.DS_Store') continue;

			const fullPath = join(dir, name);
			const relPath = relDir ? `${relDir}/${name}` : name;

			if (statSync(fullPath).isDirectory()) {
				if (relPath === '_app/immutable') continue;
				walk(fullPath, relPath);
				continue;
			}

			paths.push(`${purgePrefix}/${relPath}`);
		}
	}

	walk(distPath);
	return paths.sort();
}

async function postPurgeBatch(paths) {
	const response = await fetch(PURGE_URL, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ path: paths })
	});

	if (!response.ok) {
		const body = await response.text();
		throw new Error(`jsDelivr purge failed (${response.status}): ${body}`);
	}

	return response.json();
}

export async function purgeJsDelivr(paths, { quiet = false } = {}) {
	if (!paths.length) {
		if (!quiet) console.log('ℹ️  No jsDelivr paths to purge.');
		return;
	}

	if (!quiet) {
		console.log(`🧹 Purging ${paths.length} jsDelivr path(s)...`);
	}

	for (let index = 0; index < paths.length; index += BATCH_SIZE) {
		const batch = paths.slice(index, index + BATCH_SIZE);
		const result = await postPurgeBatch(batch);

		if (!quiet) {
			console.log(`   batch ${Math.floor(index / BATCH_SIZE) + 1}: ${result.status ?? 'ok'}`);
		}
	}

	if (!quiet) {
		console.log('✅ jsDelivr purge requested. Branch files may take a moment to refresh.');
	}
}

export async function purgeDistOnJsDelivr({
	distPath,
	cdnBaseUrl,
	quiet = false
} = {}) {
	const purgePrefix = cdnBaseToPurgePrefix(cdnBaseUrl.replace(/\/?$/, ''));
	const paths = collectPurgePaths(distPath, purgePrefix);
	await purgeJsDelivr(paths, { quiet });
	return paths;
}
