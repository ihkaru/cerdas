const fs = require('fs');
const path = require('path');

const dockerComposePath = path.join(__dirname, '../docker-compose.prod.yml');

// ANSI Colors
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

console.log(`${YELLOW}🔍 Auditing Production Docker Configuration...${RESET}\n`);

try {
    const content = fs.readFileSync(dockerComposePath, 'utf8');
    let errors = [];
    let warnings = [];

    // Rule 1: Backend Healthcheck MUST be /up (Laravel 11 standard)
    const backendSection = content.split('backend:')[1].split('client:')[0]; // Simple string extraction
    if (backendSection.includes('healthcheck:')) {
        if (!backendSection.includes('/up')) {
            errors.push("❌ Backend Healthcheck is NOT using '/up'. (Laravel 11 requires /up, not /api/health)");
        } else {
            console.log(`${GREEN}✅ Backend Healthcheck is correct (/up)${RESET}`);
        }
    } else {
        warnings.push("⚠️ Backend Healthcheck missing!");
    }

    // Rule 2: Validation of Octane Binary Config
    if (backendSection.includes('frankenphp')) {
        if (!backendSection.includes('OCTANE_FRANKENPHP_BINARY=')) {
            warnings.push("⚠️ 'OCTANE_FRANKENPHP_BINARY' environment variable might be missing in docker-compose.");
        } else {
            console.log(`${GREEN}✅ FrankenPHP Binary path configured${RESET}`);
        }
    }

    // Report
    console.log("\n--- Audit Results ---");
    if (errors.length > 0) {
        console.log(`${RED}FAILED! Found ${errors.length} critical issues:${RESET}`);
        errors.forEach(e => console.log(e));
        process.exit(1);
    } else {
        if (warnings.length > 0) {
            console.log(`${YELLOW}PASSED with warnings:${RESET}`);
            warnings.forEach(w => console.log(w));
        } else {
            console.log(`${GREEN}✨ All checks passed! Production Config looks safe.${RESET}`);
        }
        process.exit(0);
    }

} catch (e) {
    console.error(`${RED}Error reading docker-compose.prod.yml: ${e.message}${RESET}`);
    process.exit(1);
}
