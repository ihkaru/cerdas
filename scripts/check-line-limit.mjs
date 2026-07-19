import fs from 'fs';
import path from 'path';

const MAX_LINES = 600;
const files = process.argv.slice(2);
let hasError = false;

const EXCLUDE_PATTERNS = [
    /node_modules/,
    /dist/,
    /\.git/,
    /pnpm-lock\.yaml/,
    /package-lock\.json/,
    /composer\.lock/,
    /vendor/,
    /public\/build/,
    /bootstrap\/cache/,
    /storage/,
    /\.json$/, // Exclude JSON schema/config files
    /AppShell\.vue$/, // Exclude legacy large core file
    /SubmissionsPanel\.vue$/ // Exclude legacy large monitoring file
];

for (const file of files) {
    // Resolve absolute path
    const absPath = path.resolve(file);
    
    // Check exclusions
    if (EXCLUDE_PATTERNS.some(pattern => pattern.test(file))) {
        continue;
    }
    
    // Only check files that exist and are not directories
    try {
        if (!fs.existsSync(absPath)) continue;
        const stats = fs.statSync(absPath);
        if (!stats.isFile()) continue;
        
        const content = fs.readFileSync(absPath, 'utf-8');
        const lines = content.split(/\r?\n/);
        const lineCount = lines.length;
        
        if (lineCount > MAX_LINES) {
            console.error(`\x1b[31m[Line Limit Error] File "${file}" has ${lineCount} lines, which exceeds the limit of ${MAX_LINES} lines.\x1b[0m`);
            hasError = true;
        }
    } catch (err) {
        // Skip errors (e.g. permission or unreadable files)
    }
}

if (hasError) {
    console.error(`\x1b[33m\nCommit blocked! Please refactor and split files exceeding ${MAX_LINES} lines before committing.\x1b[0m\n`);
    process.exit(1);
}
