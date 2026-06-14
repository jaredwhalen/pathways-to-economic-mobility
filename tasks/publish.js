#!/usr/bin/env node

import { cpSync, rmSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import projectConfig from '../src/lib/config/project.config.js';
import { pinCdnBaseUrl, runGenerateEmbed } from './generate-embed.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ROOT_PATH = join(__dirname, '..');
const DIST_PATH = join(ROOT_PATH, 'dist');
const DOCS_PATH = join(ROOT_PATH, 'docs');

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

function gitOutput(commandArgs) {
	const result = spawnSync('git', commandArgs, {
		cwd: ROOT_PATH,
		encoding: 'utf-8'
	});

	if (result.status !== 0) {
		process.exit(result.status ?? 1);
	}

	return result.stdout.trim();
}

function hasChanges(paths) {
	const result = spawnSync('git', ['status', '--porcelain', ...paths], {
		cwd: ROOT_PATH,
		encoding: 'utf-8'
	});

	if (result.status !== 0) {
		process.exit(result.status ?? 1);
	}

	return Boolean(result.stdout?.trim());
}

function build() {
	console.log('🏗️  Building production bundle...');
	run('npm', ['run', 'build']);
}

function syncDocsFromDist() {
	console.log('📄 Syncing dist/ → docs/ for GitHub Pages...');
	rmSync(DOCS_PATH, { recursive: true, force: true });
	cpSync(DIST_PATH, DOCS_PATH, { recursive: true });
	writeFileSync(join(DOCS_PATH, '.nojekyll'), '');
	console.log('✅ docs/ updated');
}

function generateEmbedForCommit(gitRef) {
	const cdnBaseUrl = pinCdnBaseUrl(projectConfig.build.cdnBaseUrl, gitRef);
	console.log('🧩 Generating wordpress-embed.html...');
	runGenerateEmbed({ cdnBaseUrl, quiet: true });
	console.log(`✅ wordpress-embed.html written (pinned to ${gitRef})`);
}

function commitAndPush() {
	const distDocsChanged = hasChanges(['dist', 'docs']);

	if (distDocsChanged) {
		console.log('📦 Staging dist/ and docs/...');
		run('git', ['add', '-A', 'dist', 'docs']);
		console.log('💾 Committing build output...');
		run('git', ['commit', '-m', 'Publish build']);
	} else {
		console.log('ℹ️  dist/ and docs/ unchanged since last commit.');
	}

	const gitRef = gitOutput(['rev-parse', 'HEAD']);
	generateEmbedForCommit(gitRef);

	if (hasChanges(['wordpress-embed.html'])) {
		console.log('📦 Staging wordpress-embed.html...');
		run('git', ['add', 'wordpress-embed.html']);

		if (distDocsChanged) {
			console.log('💾 Amending commit with pinned embed...');
			run('git', ['commit', '--amend', '--no-edit']);
		} else {
			console.log('💾 Committing embed update...');
			run('git', ['commit', '-m', 'Update embed CDN pin']);
		}
	}

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
	syncDocsFromDist();

	if (noGit) {
		generateEmbedForCommit('main');
		console.log('⏭️  Skipping git (--no-git).');
		console.log('   dist/, docs/, and wordpress-embed.html are ready locally.');
		return;
	}

	commitAndPush();
}

main();
