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

    // Rule 3: APP_DEBUG must be false
    if (backendSection.includes('APP_DEBUG=true')) {
        errors.push("❌ APP_DEBUG is set to 'true'! It MUST be 'false' for production.");
    } else {
        console.log(`${GREEN}✅ APP_DEBUG is safe (false)${RESET}`);
    }

    // Rule 4: APP_ENV must be production
    if (!backendSection.includes('APP_ENV=production')) {
        errors.push("❌ APP_ENV is failing (should be 'production').");
    } else {
        console.log(`${GREEN}✅ APP_ENV is correct (production)${RESET}`);
    }

    // Rule 5: DB_HOST sanity check
    if (backendSection.includes('DB_HOST=localhost') || backendSection.includes('DB_HOST=127.0.0.1')) {
        errors.push("❌ DB_HOST is set to localhost! In Docker, this refers to the container itself, not the host.");
    } else {
         console.log(`${GREEN}✅ DB_HOST looks valid (not localhost)${RESET}`);
    }

    // Rule 6: Opcache check
    if (!backendSection.includes('PHP_OPCACHE_ENABLE=1')) {
        warnings.push("⚠️ PHP_OPCACHE_ENABLE is not enabled. Recommended for performance.");
    } else {
        console.log(`${GREEN}✅ Opcache is enabled${RESET}`);
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
