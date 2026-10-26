#!/usr/bin/env node
/**
 * Asset budget and licence gate. Fails when an asset is unlisted, oversized, or
 * missing a licence, so a rip cannot slip into the build unnoticed.
 *
 * Run: node scripts/check-assets.mjs
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const assetsDir = join(root, 'public', 'assets');
const manifestPath = join(assetsDir, 'manifest.json');

const MAX_TOTAL_BYTES = 5 * 1024 * 1024;
const MAX_FILE_BYTES = 1 * 1024 * 1024;
const ALLOWED_LICENCES = new Set(['CC0-1.0', 'CC-BY-4.0', 'CC-BY-SA-4.0', 'OFL-1.1', 'MIT', 'Apache-2.0']);

function walk(dir) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(full));
    else if (entry.isFile()) files.push(full);
  }
  return files;
}

const errors = [];
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const listed = new Map(manifest.assets.map((asset) => [asset.file, asset]));
const onDisk = walk(assetsDir)
  .filter((file) => !file.endsWith('manifest.json'))
  .map((file) => relative(assetsDir, file).split(sep).join('/'));

let total = 0;
for (const file of onDisk) {
  const size = statSync(join(assetsDir, file)).size;
  total += size;

  if (size > MAX_FILE_BYTES) {
    errors.push(`${file}: ${size} bytes exceeds the 1 MiB per-file limit`);
  }
  const asset = listed.get(file);
  if (!asset) {
    errors.push(`${file}: not listed in manifest.json`);
    continue;
  }
  if (!asset.license || !ALLOWED_LICENCES.has(asset.license)) {
    errors.push(`${file}: licence "${asset.license ?? 'missing'}" is not allowed`);
  }
  if (!asset.author || !asset.source) {
    errors.push(`${file}: author and source are required`);
  }
}

for (const file of listed.keys()) {
  if (!onDisk.includes(file)) errors.push(`${file}: listed but missing on disk`);
}

if (total > MAX_TOTAL_BYTES) {
  errors.push(`assets total ${total} bytes exceeds the 5 MiB limit`);
}

if (errors.length > 0) {
  for (const error of errors) console.error(`FAIL ${error}`);
  process.exit(1);
}

console.log(`assets OK: ${onDisk.length} files, ${(total / 1024).toFixed(1)} KiB, all licensed`);
