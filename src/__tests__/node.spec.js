import tape from 'tape-catch';

import clientSuite from './nodeSuites/client.spec.js';
import providerSuite from './nodeSuites/provider.spec.js';

tape('## OpenFeature JavaScript Split Client - tests', async function (assert) {
  assert.test('Client Tests', clientSuite);
});


tape('## OpenFeature JavaScript Split Provider - tests', async function (assert) {
  assert.test('Provider Tests', providerSuite);
});
