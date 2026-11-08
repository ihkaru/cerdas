#!/usr/bin/env bun
/**
 * Deterministic Line Limit & Single Responsibility Principle (SRP) Enforcer
 * Enforces maximum line limits (default: 400 lines) across code files in Cerdas.
 * 
 * Usage:
 *   bun scripts/check-line-limits.mjs --all
 *   bun scripts/check-line-limits.mjs --staged
 *   bun scripts/check-line-limits.mjs path/to/file.vue
 *   bun scripts/check-line-limits.mjs --json
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const DEFAULT_MAX_LINES = 400;
const CODE_EXTENSIONS = new Set(['.php', '.ts', '.js', '.vue', '.tsx', '.jsx']);
const IGNORE_PATTERNS = [
    /[\\/]node_modules[\\/]/,
    /[\\/]dist[\\/]/,
    /[\\/]\.git[\\/]/,
    /[\\/]vendor[\\/]/,
    /[\\/]storage[\\/]/,
    /[\\/]bootstrap[\\/]cache[\\/]/,
    /[\\/]\.gemini[\\/]/,
    /[\\/]\.pnpm-store[\\/]/,
    /[\\/]public[\\/]build[\\/]/,
    /[\\/]android[\\/]/,
    /[\\/]ios[\\/]/,
    /\.d\.ts$/,
    /\.test\.ts$/,
    /\.spec\.ts$/
];

const rootDir = path.resolve(import.meta.dir, '..');
const allowlistPath = path.join(rootDir, '.line-limit-allowlist.json');

// Parse CLI flags
const args = process.argv.slice(2);
let maxLines = DEFAULT_MAX_LINES;
let scanAll = false;
let scanStaged = false;
let outputJson = false;
const specificFiles = [];

for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--all') {
        scanAll = true;
    } else if (arg === '--staged') {
        scanStaged = true;
    } else if (arg === '--json') {
        outputJson = true;
    } else if (arg === '--max' && args[i + 1]) {
        maxLines = parseInt(args[++i], 10) || DEFAULT_MAX_LINES;
    } else if (!arg.startsWith('--')) {
        specificFiles.push(arg);
    }
}

// Load technical debt ratchet allowlist
let allowlist = { exemptions: {} };
if (fs.existsSync(allowlistPath)) {
    try {
        allowlist = JSON.parse(fs.readFileSync(allowlistPath, 'utf-8'));
    } catch {
        console.warn(`[WARN] Failed to parse ${allowlistPath}, proceeding without allowlist.`);
    }
}

// Collect target files
function getFilesToScan() {
    if (specificFiles.length > 0) {
        return specificFiles;
    }
    if (scanStaged) {
        try {
            const out = execSync('git diff --cached --name-only --diff-filter=ACMR', {
                cwd: rootDir,
                encoding: 'utf-8'
            });
            return out.split('\n').filter(Boolean);
        } catch {
            return [];
        }
    }
    // Scan all code directories by default or when --all is passed
    const results = [];
    const targetDirs = ['apps', 'packages', 'scripts'];

    function walkDir(dir) {
        if (!fs.existsSync(dir)) return;
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            const relPath = path.relative(rootDir, fullPath);

            if (IGNORE_PATTERNS.some(p => p.test(relPath))) continue;

            if (entry.isDirectory()) {
                if (!entry.name.startsWith('.')) {
                    walkDir(fullPath);
                }
            } else if (entry.isFile()) {
                const ext = path.extname(entry.name).toLowerCase();
                if (CODE_EXTENSIONS.has(ext)) {
                    results.push(relPath);
                }
            }
        }
    }

    for (const d of targetDirs) {
        walkDir(path.join(rootDir, d));
    }
    return results;
}

const files = getFilesToScan();
const violations = [];
const graduated = [];
let scannedCount = 0;

for (const rawFile of files) {
    const fullPath = path.isAbsolute(rawFile) ? rawFile : path.join(rootDir, rawFile);
    const relPath = path.relative(rootDir, fullPath).replace(/\\/g, '/');

    if (IGNORE_PATTERNS.some(p => p.test(relPath))) continue;
    const ext = path.extname(fullPath).toLowerCase();
    if (!CODE_EXTENSIONS.has(ext)) continue;

    if (!fs.existsSync(fullPath)) continue;
    const stat = fs.statSync(fullPath);
    if (!stat.isFile()) continue;

    scannedCount++;
    const content = fs.readFileSync(fullPath, 'utf-8');
    const lineCount = content.split(/\r?\n/).length;

    const exemption = allowlist.exemptions?.[relPath];

    if (exemption) {
        const allowed = exemption.max_allowed_lines || maxLines;
        if (lineCount > allowed) {
            violations.push({
                file: relPath,
                lines: lineCount,
                limit: allowed,
                isExempt: true,
                reason: exemption.reason || 'Allowlist ratchet limit exceeded'
            });
        } else if (lineCount <= maxLines) {
            graduated.push({
                file: relPath,
                lines: lineCount,
                previousLimit: allowed
            });
        }
    } else {
        if (lineCount > maxLines) {
            violations.push({
                file: relPath,
                lines: lineCount,
                limit: maxLines,
                isExempt: false,
                reason: `Exceeds strict SRP limit of ${maxLines} lines`
            });
        }
    }
}

if (outputJson) {
    console.log(JSON.stringify({
        ok: violations.length === 0,
        scanned: scannedCount,
        maxLines,
        violations,
        graduated
    }, null, 2));
    process.exit(violations.length === 0 ? 0 : 1);
}

// Pretty terminal format
console.log(`\n📏 Deterministic SRP Line Limit Gate (Max: ${maxLines} lines)`);
console.log('='.repeat(65));
console.log(`Scanned files: ${scannedCount} code files`);

if (graduated.length > 0) {
    console.log(`\n🎉 Files ready to graduate from allowlist (now <= ${maxLines} lines):`);
    for (const g of graduated) {
        console.log(`   ✨ ${g.file} (${g.lines}L, was ${g.previousLimit}L)`);
    }
}

if (violations.length > 0) {
    console.log(`\n❌ Found ${violations.length} line-limit violation(s):`);
    for (const v of violations) {
        const tag = v.isExempt ? '[ALLOWLIST OVERFLOW]' : '[NEW SRP VIOLATION]';
        console.log(`   🚨 ${tag} ${v.file}: ${v.lines} lines (limit: ${v.limit})`);
        console.log(`      Reason: ${v.reason}`);
    }
    console.log('\n💡 Resolution: Deconstruct bloated components or services into single-responsibility atomic units.\n');
    process.exit(1);
} else {
    console.log(`\n✅ All ${scannedCount} files adhere to the ${maxLines}-line SRP constraint (or valid ratchet ledger).\n`);
    process.exit(0);
}
