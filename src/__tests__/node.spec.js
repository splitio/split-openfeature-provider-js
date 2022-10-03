import tape from 'tape-catch';

import clientSuite from './nodeSuites/client.spec.js';

tape('## OpenFeature JavaScript Split Provider - tests', async function (assert) {
  assert.test('Client Tests', clientSuite);
});