#!/usr/bin/env node
/**
 * Bundle budget gate: the hub must stay tiny, and each game must fit in the
 * 500 KB gzip ceiling with Phaser included.
 *
 * Run after `npm run build`: node scripts/check-budget.mjs
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const assetsDir = join(root, 'dist', 'assets');

const HUB_LIMIT = 60 * 1024;
const GAME_LIMIT = 500 * 1024;
const FILE_LIMIT = 2 * 1024 * 1024;

let files;
try {
  files = readdirSync(assetsDir);
} catch {
  console.error('FAIL dist/assets is missing; run `npm run build` first');
  process.exit(1);
}

const gzipSize = (file) => gzipSync(readFileSync(join(assetsDir, file)), { level: 9 }).length;

const hub = files.filter((file) => /^hub-.*\.(js|css)$/.test(file));
const game = files.filter((file) => /^(egara-.*\.(js|css)|phaser-.*\.js)$/.test(file));
const errors = [];

const sum = (names) => names.reduce((total, file) => total + gzipSize(file), 0);
const hubBytes = sum(hub);
const gameBytes = sum(game);

if (hub.filter((file) => file.endsWith('.js')).length === 0) {
  errors.push('hub entry chunk not found (expected hub-*.js)');
}
if (!files.some((file) => /^egara-.*\.js$/.test(file))) {
  errors.push('egara entry chunk not found (expected egara-*.js)');
}
if (!files.some((file) => /^phaser-.*\.js$/.test(file))) {
  errors.push('phaser chunk not found');
}

if (hubBytes > HUB_LIMIT) {
  errors.push(`hub route ${(hubBytes / 1024).toFixed(1)} KB gzip exceeds 60 KB`);
}
if (gameBytes > GAME_LIMIT) {
  errors.push(`egara route ${(gameBytes / 1024).toFixed(1)} KB gzip exceeds 500 KB`);
}

for (const file of files) {
  const size = statSync(join(assetsDir, file)).size;
  if (size > FILE_LIMIT) errors.push(`${file}: ${(size / 1024).toFixed(0)} KB exceeds the 2 MiB file limit`);
}

if (errors.length > 0) {
  for (const error of errors) console.error(`FAIL ${error}`);
  process.exit(1);
}

console.log(
  `budget OK: hub ${(hubBytes / 1024).toFixed(1)} KB gzip, egara ${(gameBytes / 1024).toFixed(1)} KB gzip, largest file ${(
    Math.max(...files.map((file) => statSync(join(assetsDir, file)).size)) / 1024
  ).toFixed(0)} KB`
);
