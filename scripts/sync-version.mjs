/**
 * sync-version.mjs
 * 
 * Reads version from apps/client/package.json (single source of truth)
 * and syncs it to:
 *   1. apps/editor/package.json
 *   2. apps/client/android/app/build.gradle (versionName + versionCode)
 *   3. Root package.json
 * 
 * Usage: node scripts/sync-version.mjs
 */

import { readFileSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// --- 1. Read source version ---
const clientPkg = JSON.parse(readFileSync(resolve(ROOT, 'apps/client/package.json'), 'utf-8'));
const version = clientPkg.version;
const [major, minor, patch] = version.split('.').map(Number);
const versionCode = major * 10000 + minor * 100 + patch;

console.log(`📦 Version: ${version} (versionCode: ${versionCode})`);

// --- 2. Sync root package.json ---
const rootPkgPath = resolve(ROOT, 'package.json');
const rootPkg = JSON.parse(readFileSync(rootPkgPath, 'utf-8'));
if (rootPkg.version !== version) {
    rootPkg.version = version;
    writeFileSync(rootPkgPath, JSON.stringify(rootPkg, null, 2) + '\n');
    console.log(`  ✅ Root package.json → ${version}`);
} else {
    console.log(`  ⏭️  Root package.json already at ${version}`);
}

// --- 3. Sync editor package.json ---
const editorPkgPath = resolve(ROOT, 'apps/editor/package.json');
const editorPkg = JSON.parse(readFileSync(editorPkgPath, 'utf-8'));
if (editorPkg.version !== version) {
    editorPkg.version = version;
    writeFileSync(editorPkgPath, JSON.stringify(editorPkg, null, 2) + '\n');
    console.log(`  ✅ Editor package.json → ${version}`);
} else {
    console.log(`  ⏭️  Editor package.json already at ${version}`);
}

// --- 4. Sync Android build.gradle ---
const gradlePath = resolve(ROOT, 'apps/client/android/app/build.gradle');
let gradle = readFileSync(gradlePath, 'utf-8');

const origGradle = gradle;
gradle = gradle.replace(/versionCode\s+\d+/, `versionCode ${versionCode}`);
gradle = gradle.replace(/versionName\s+"[^"]*"/, `versionName "${version}"`);

if (gradle !== origGradle) {
    writeFileSync(gradlePath, gradle);
    console.log(`  ✅ build.gradle → versionName "${version}", versionCode ${versionCode}`);
} else {
    console.log(`  ⏭️  build.gradle already up to date`);
}

console.log('\n✅ Version sync complete!');
