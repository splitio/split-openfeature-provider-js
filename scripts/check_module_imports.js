'use strict';

// Smoke test for the published entry points: verifies the package can be loaded
// with both native ESM `import` and CommonJS `require` (see issue #26).
const { execFileSync } = require('child_process');
const path = require('path');

const root = path.resolve(__dirname, '..');
const checks = {
  esm: ['--input-type=module', '-e', "import { OpenFeatureSplitProvider } from './es/index.js'; if (typeof OpenFeatureSplitProvider !== 'function') process.exit(1);"],
  cjs: ['-e', "const { OpenFeatureSplitProvider } = require('./lib/index.js'); if (typeof OpenFeatureSplitProvider !== 'function') process.exit(1);"],
};

for (const [name, args] of Object.entries(checks)) {
  try {
    execFileSync(process.execPath, args, { cwd: root, stdio: 'inherit' });
    console.log(`${name.toUpperCase()} import OK`);
  } catch {
    console.error(`${name.toUpperCase()} import FAILED`);
    process.exit(1);
  }
}
