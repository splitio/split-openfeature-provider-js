'use strict';

// Smoke test for the published entry points: verifies the package can be loaded
// with both native ESM `import` and CommonJS `require` (see issue #26).
const { execFileSync } = require('child_process');
const path = require('path');

const root = path.resolve(__dirname, '..');
const assertExport = (format) =>
  "if (typeof OpenFeatureSplitProvider !== 'function') { " +
  `console.error('${format} export check FAILED: expected export OpenFeatureSplitProvider to be a function, got ' + typeof OpenFeatureSplitProvider); ` +
  'process.exit(1); }';
const checks = {
  esm: ['--input-type=module', '-e', `import { OpenFeatureSplitProvider } from './es/index.js'; ${assertExport('ESM')}`],
  cjs: ['-e', `const { OpenFeatureSplitProvider } = require('./lib/index.js'); ${assertExport('CJS')}`],
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
