import tape from 'tape-catch';

import clientSuite from './nodeSuites/client.spec.js';
import providerSuite from './nodeSuites/provider.spec.js';

tape('## OpenFeature NodeJS Split Provider - tests', async function (assert) {
  assert.test('Client Tests', clientSuite);
  assert.test('Provider Tests', providerSuite);
});