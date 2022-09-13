const OpenFeature = require('@openfeature/nodejs-sdk').OpenFeature;
const SplitFactory = require('@splitsoftware/splitio').SplitFactory;
import { OpenFeatureSplitProvider } from '../..';

export default async function(assert) {

  const useDefaultTest = async (client) => {
    // assert.equal(2, 2);
    let flagName = 'random-non-existent-feature';

    let result = await client.getBooleanValue(flagName, false);
    assert.equal(result, false);

    result = await client.getBooleanValue(result, true);
    assert.equal(result, true);

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
    let details = await client.getBooleanDetails('non-existent-feature', false, {});
    assert.equals(details.value, false);
    assert.equals('TARGETING_KEY_MISSING', details.reason);
  };

  const getControlVariantNonExistentSplit = async (client) => {
    let details = await client.getBooleanDetails('non-existent-feature', false);
    assert.equals(details.value, false);
    assert.equals(details.variant, 'control');
    assert.equals(details.reason, 'FLAG_NOT_FOUND');
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
    assert.equals(result, { 'key': 'value' });
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
    assert.equals(details.errorCode, null);
  };

  const getNumberDetailsTest = async (client) => {
    let details = await client.getNumberDetails('int_feature', 0);
    assert.equals(details.flagKey, 'int_feature');
    assert.equals(details.reason, 'TARGETING_MATCH');
    assert.equals(details.value, 32);
    assert.equals(details.variant, '32');
    assert.equals(details.errorCode, null);
  };

  const getStringDetailsTest = async (client) => {
    let details = await client.getStringDetails('some_other_feature', 'blah');
    assert.equals(details.flagKey, 'some_other_feature');
    assert.equals(details.reason, 'TARGETING_MATCH');
    assert.equals(details.value, 'off');
    assert.equals(details.variant, 'off');
    assert.equals(details.errorCode, null);
  };

  const getObjectDetailsTest = async (client) => {
    let details = await client.getObjectDetails('obj_feature', {});
    assert.equals(details.flagKey, 'obj_feature');
    assert.equals(details.reason, 'TARGETING_MATCH');
    assert.equals(details.value, { key: 'value' });
    assert.equals(details.variant, '{"key": "value"}');
    assert.equals(details.errorCode, null);
  };

  const getBooleanFailTest = async (client) => {
    let value = await client.getBooleanValue('obj_feature', false);
    assert.equals(value, false);

    let details = await client.getBooleanDetails('obj_feature', false);
    assert.equals(details.value, false);
    assert.equals(details.errorCode, 'PARSE_ERROR');
    assert.equals(details.reason, 'ERROR');
    assert.equals(details.variant, null);
  };

  const getNumberFailTest = async (client) => {
    let value = await client.getNumberValue('obj_feature', 10);
    assert.equals(value, 10);

    let details = await client.getNumberDetails('obj_feature', 10);
    assert.equals(details.value, 10);
    assert.equals(details.errorCode, 'PARSE_ERROR');
    assert.equals(details.reason, 'ERROR');
    assert.equals(details.variant, null);
  };

  const getObjectFailTest = async (client) => {
    let defaultObject = { foo: 'bar' };
    let value = await client.getObjectValue('int_feature', defaultObject);
    assert.equals(value, defaultObject);

    let details = await client.getObjectDetails('int_feature', defaultObject);
    assert.equals(details.value, defaultObject);
    assert.equals(details.errorCode, 'PARSE_ERROR');
    assert.equals(details.reason, 'ERROR');
    assert.equals(details.variant, null);
  };

  let splitClient = SplitFactory({
    core: {
      authorizationKey: 'localhost'
    },
    features: './split.yaml'
  }).client();

  let provider = new OpenFeatureSplitProvider({splitClient});
//   OpenFeature.setProvider(provider);

  let client = OpenFeature.getClient('test');
  let evaluationContext = {
    targetingKey: 'key'
  };
  client.evaluationContext = evaluationContext;

  useDefaultTest(client);
 
  missingTargetingKeyTest(client);
  
  getControlVariantNonExistentSplit(client);

  getBooleanSplitTest(client);
  getBooleanSplitWithKeyTest(client);
 
  getStringSplitTest(client);
  getNumberSplitTest(client);
  getObjectSplitTest(client);
 
  getMetadataNameTest(client);
 
  getBooleanDetailsTest(client);
  getNumberDetailsTest(client);
  getStringDetailsTest(client);
  getObjectDetailsTest(client);
 
  getBooleanFailTest(client);
  getNumberFailTest(client);
  getObjectFailTest(client);

  assert.end();
}