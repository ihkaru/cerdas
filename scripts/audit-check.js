/* eslint-disable sonarjs/no-os-command-from-path */
const { execSync } = require('child_process');
try {
  const output = execSync('pnpm audit --json', { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
  console.log(output);
} catch (e) {
  console.log(e.stdout);
}
