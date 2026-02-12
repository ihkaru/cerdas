const fs = require('fs');
const path = require('path');

const outputFile = 'DOCKER_CONTEXT.md';
const rootDir = process.cwd();

const filesToInclude = [
    // Root Compose
    'docker-compose.yml',
    'docker-compose.prod.yml',
    'docker-compose.dev.yml',
    
    // Backend
    'apps/backend/Dockerfile',
    'apps/backend/Dockerfile.prod',
    'apps/backend/start-container.sh',
    
    // Client
    'apps/client/Dockerfile',
    'apps/client/Dockerfile.prod',
    'apps/client/nginx.conf',
    'apps/client/capacitor.config.ts', // Relevant for build
    
    // Editor
    'apps/editor/Dockerfile',
    'apps/editor/Dockerfile.prod',
    'apps/editor/nginx.conf',

    // Envs (Root)
    '.env',
    '.env.example',
    '.env.docker',
    '.env.production',
    
    // Envs (Apps)
    'apps/client/.env',
    'apps/backend/.env'
];

let output = '# Consolidated Docker Context\n\nGenerated on: ' + new Date().toISOString() + '\n\n';

filesToInclude.forEach(filePath => {
    const fullPath = path.join(rootDir, filePath);
    
    if (fs.existsSync(fullPath)) {
        try {
            const content = fs.readFileSync(fullPath, 'utf8');
            const ext = path.extname(fullPath).substring(1) || 'txt';
            const lang = ext === 'yml' || ext === 'yaml' ? 'yaml' : 
                         ext === 'js' || ext === 'ts' ? 'javascript' :
                         ext === 'sh' ? 'bash' :
                         ext === 'env' ? 'properties' : 
                         'properties'; // Default for .env/config

            output += `## File: ${filePath}\n\n`;
            output += '```' + lang + '\n';
            output += content;
            output += '\n```\n\n';
            console.log(`✅ Added: ${filePath}`);
        } catch (err) {
            console.error(`❌ Error reading ${filePath}: ${err.message}`);
        }
    } else {
        console.warn(`⚠️ Skipped (Not Found): ${filePath}`);
    }
});

fs.writeFileSync(outputFile, output);
console.log(`\n🎉 Report generated at: ${outputFile}`);
