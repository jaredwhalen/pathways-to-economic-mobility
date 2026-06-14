#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import jughead from 'jughead';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const DEFAULT_INPUT = join(ROOT, 'src/lib/data/copy.json');
const DEFAULT_OUTPUT = join(ROOT, 'docs/copy.archieml');

function parseArgs(argv) {
	const args = { input: DEFAULT_INPUT, output: DEFAULT_OUTPUT };

	for (let i = 2; i < argv.length; i++) {
		const arg = argv[i];

		if (arg === '--input' || arg === '-i') {
			args.input = argv[++i];
		} else if (arg === '--output' || arg === '-o') {
			args.output = argv[++i];
		} else if (arg === '--help' || arg === '-h') {
			args.help = true;
		} else {
			console.error(`Unknown argument: ${arg}`);
			process.exit(1);
		}
	}

	return args;
}

function printHelp() {
	console.log(`Usage: node tasks/archie-reverse.js [options]

Generate ArchieML from copy.json for editing in Google Docs.

Options:
  -i, --input <path>   JSON source (default: src/lib/data/copy.json)
  -o, --output <path>  ArchieML output (default: docs/copy.archieml)
  -h, --help           Show this help
`);
}

function main() {
	const { input, output, help } = parseArgs(process.argv);

	if (help) {
		printHelp();
		return;
	}

	if (!existsSync(input)) {
		console.error(`Input file not found: ${input}`);
		process.exit(1);
	}

	const copy = JSON.parse(readFileSync(input, 'utf8'));
	const archie = jughead.archieml(copy, { strict: false });

	writeFileSync(output, archie, 'utf8');

	console.log(`✅ ArchieML written to ${output}`);
	console.log(`   Source: ${input}`);
}

main();
