#!/usr/bin/env node

import { cpSync, rmSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import { runGenerateEmbed } from './generate-embed.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ROOT_PATH = join(__dirname, '..');
const DIST_PATH = join(ROOT_PATH, 'dist');
const DOCS_PATH = join(ROOT_PATH, 'docs');
const EMBED_PATH = join(ROOT_PATH, 'wordpress-embed.html');

const args = new Set(process.argv.slice(2));
const noPush = args.has('--no-push');
const noGit = args.has('--no-git');

function run(command, commandArgs, { allowFailure = false } = {}) {
	const result = spawnSync(command, commandArgs, {
		cwd: ROOT_PATH,
		stdio: 'inherit',
		encoding: 'utf-8'
	});

	if (result.status !== 0 && !allowFailure) {
		process.exit(result.status ?? 1);
	}

	return result;
}

function build() {
	console.log('🏗️  Building production bundle...');
	run('npm', ['run', 'build']);
}

function generateEmbed() {
	console.log('🧩 Generating wordpress-embed.html...');
	runGenerateEmbed({ quiet: true });
	console.log('✅ wordpress-embed.html written');
}

function syncDocsFromDist() {
	console.log('📄 Syncing dist/ → docs/ for GitHub Pages...');
	rmSync(DOCS_PATH, { recursive: true, force: true });
	cpSync(DIST_PATH, DOCS_PATH, { recursive: true });
	writeFileSync(join(DOCS_PATH, '.nojekyll'), '');
	console.log('✅ docs/ updated');
}

function hasPublishChanges() {
	const result = spawnSync('git', ['status', '--porcelain', 'dist', 'docs', 'wordpress-embed.html'], {
		cwd: ROOT_PATH,
		encoding: 'utf-8'
	});

	if (result.status !== 0) {
		process.exit(result.status ?? 1);
	}

	return Boolean(result.stdout?.trim());
}

function commitAndPush() {
	if (!hasPublishChanges()) {
		console.log('ℹ️  No publish output changes to commit.');
		return;
	}

	console.log('📦 Staging dist/, docs/, and wordpress-embed.html...');
	run('git', ['add', '-A', 'dist', 'docs', 'wordpress-embed.html']);

	console.log('💾 Committing publish output...');
	run('git', ['commit', '-m', 'Publish build']);

	if (noPush) {
		console.log('⏭️  Skipping push (--no-push).');
		return;
	}

	console.log('🚀 Pushing to origin...');
	run('git', ['push']);
	console.log('✅ Published. jsDelivr and GitHub Pages will update after GitHub receives the push.');
}

function main() {
	build();
	generateEmbed();
	syncDocsFromDist();

	if (noGit) {
		console.log('⏭️  Skipping git (--no-git).');
		console.log('   dist/, docs/, and wordpress-embed.html are ready locally.');
		return;
	}

	commitAndPush();
}

main();
