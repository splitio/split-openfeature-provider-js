const OpenFeature = require('@openfeature/server-sdk').OpenFeature;
const SplitFactory = require('@splitsoftware/splitio').SplitFactory;
import { OpenFeatureSplitProvider } from '../..';

export default async function(assert) {

  const useDefaultTest = async (client) => {
    let flagName = 'random-non-existent-feature';

    let result = await client.getBooleanValue(flagName, false);
    assert.equal(result, false);

    let result2 = await client.getBooleanValue(flagName, true);
    assert.equal(result2, true);

    let defaultString = 'blah';
    let resultString = await client.getStringValue(flagName, defaultString);
    assert.equals(resultString, defaultString);

    let defaultInt = 100;
    let resultInt = await client.getNumberValue(flagName, defaultInt);
    assert.equals(resultInt, defaultInt);

    let defaultStructure = {
      foo: 'bar'
    };
    let resultStructure = await client.getObjectValue(flagName, defaultStructure);
    assert.equals(resultStructure, defaultStructure);
  };

  const missingTargetingKeyTest = async (client) => {
    let details = await client.getBooleanDetails('non-existent-feature', false, { targetingKey: undefined });
    assert.equals(details.value, false);
    assert.equals(details.errorCode, 'TARGETING_KEY_MISSING');
  };

  const getControlVariantNonExistentSplit = async (client) => {
    let details = await client.getBooleanDetails('non-existent-feature', false);
    assert.equals(details.value, false);
    assert.equals(details.errorCode, 'FLAG_NOT_FOUND');
    assert.equals(details.reason, 'ERROR');
  };

  const getBooleanSplitTest = async (client) => {
    let result = await client.getBooleanValue('some_other_feature', true);
    assert.equals(result, false);
  };

  const getBooleanSplitWithKeyTest = async (client) => {
    let result = await client.getBooleanValue('my_feature', false);
    assert.equals(result, true);

    result = await client.getBooleanValue('my_feature', true, { targetingKey: 'randomKey' });
    assert.equals(result, false);
  };

  const getStringSplitTest = async (client) => {
    let result = await client.getStringValue('some_other_feature', 'on');
    assert.equals(result, 'off');
  };

  const getNumberSplitTest = async (client) => {
    let result = await client.getNumberValue('int_feature', 0);
    assert.equals(result, 32);
  };

  const getObjectSplitTest = async (client) => {
    let result = await client.getObjectValue('obj_feature', {});
    assert.looseEquals(result, { 'key': 'value' });
  };

  const getMetadataNameTest = async (client) => {
    assert.equals(client.metadata.name, 'test');
  };

  const getBooleanDetailsTest = async (client) => {
    let details = await client.getBooleanDetails('some_other_feature', true);
    assert.equals(details.flagKey, 'some_other_feature');
    assert.equals(details.reason, 'TARGETING_MATCH');
    assert.equals(details.value, false);
    assert.equals(details.variant, 'off');
    assert.equals(details.errorCode, undefined);
  };

  const getNumberDetailsTest = async (client) => {
    let details = await client.getNumberDetails('int_feature', 0);
    assert.equals(details.flagKey, 'int_feature');
    assert.equals(details.reason, 'TARGETING_MATCH');
    assert.equals(details.value, 32);
    assert.equals(details.variant, '32');
    assert.equals(details.errorCode, undefined);
  };

  const getStringDetailsTest = async (client) => {
    let details = await client.getStringDetails('some_other_feature', 'blah');
    assert.equals(details.flagKey, 'some_other_feature');
    assert.equals(details.reason, 'TARGETING_MATCH');
    assert.equals(details.value, 'off');
    assert.equals(details.variant, 'off');
    assert.equals(details.errorCode, undefined);
  };

  const getObjectDetailsTest = async (client) => {
    let details = await client.getObjectDetails('obj_feature', {});
    assert.equals(details.flagKey, 'obj_feature');
    assert.equals(details.reason, 'TARGETING_MATCH');
    assert.looseEquals(details.value, { key: 'value' });
    assert.equals(details.variant, '{"key": "value"}');
    assert.equals(details.errorCode, undefined);
  };

  const getBooleanFailTest = async (client) => {
    let value = await client.getBooleanValue('obj_feature', false);
    assert.equals(value, false);

    let details = await client.getBooleanDetails('obj_feature', false);
    assert.equals(details.value, false);
    assert.equals(details.errorCode, 'PARSE_ERROR');
    assert.equals(details.reason, 'ERROR');
    assert.equals(details.variant, undefined);
  };

  const getNumberFailTest = async (client) => {
    let value = await client.getNumberValue('obj_feature', 10);
    assert.equals(value, 10);

    let details = await client.getNumberDetails('obj_feature', 10);
    assert.equals(details.value, 10);
    assert.equals(details.errorCode, 'PARSE_ERROR');
    assert.equals(details.reason, 'ERROR');
    assert.equals(details.variant, undefined);
  };

  const getObjectFailTest = async (client) => {
    let defaultObject = { foo: 'bar' };
    let value = await client.getObjectValue('int_feature', defaultObject);
    assert.equals(value, defaultObject);

    let details = await client.getObjectDetails('int_feature', defaultObject);
    assert.equals(details.value, defaultObject);
    assert.equals(details.errorCode, 'PARSE_ERROR');
    assert.equals(details.reason, 'ERROR');
    assert.equals(details.variant, undefined);
  };

  let splitClient = SplitFactory({
    core: {
      authorizationKey: 'localhost'
    },
    features: './split.yaml',
    debug: 'DEBUG'
  }).client();

  let provider = new OpenFeatureSplitProvider({splitClient});
  OpenFeature.setProvider(provider);

  let client = OpenFeature.getClient('test');
  let evaluationContext = {
    targetingKey: 'key'
  };
  client.setContext(evaluationContext);

  await useDefaultTest(client);
  await missingTargetingKeyTest(client);  
  await getControlVariantNonExistentSplit(client);

  await getBooleanSplitTest(client);
  await getBooleanSplitWithKeyTest(client);
 
  await getStringSplitTest(client);
  await getNumberSplitTest(client);
  await getObjectSplitTest(client);
 
  await getMetadataNameTest(client);
 
  await getBooleanDetailsTest(client);
  await getNumberDetailsTest(client);
  await getStringDetailsTest(client);
  await getObjectDetailsTest(client);
 
  await getBooleanFailTest(client);
  await getNumberFailTest(client);
  await getObjectFailTest(client);

  splitClient.destroy(); // Shut down open handles

  assert.end();
}