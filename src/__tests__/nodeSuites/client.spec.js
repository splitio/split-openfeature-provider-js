/* eslint-disable jest/no-conditional-expect */
import { OpenFeatureSplitProvider } from '../../lib/js-split-provider';
import { getLocalHostSplitClient } from '../testUtils';

import { OpenFeature } from '@openfeature/server-sdk';

describe('client tests', () => {

  let client;
  let splitClient;
  let provider;

  beforeEach(() => {
    splitClient = getLocalHostSplitClient();
    provider = new OpenFeatureSplitProvider({ splitClient });

    OpenFeature.setProvider(provider);

    client = OpenFeature.getClient('test');
    let evaluationContext = {
      targetingKey: 'key'
    };
    client.setContext(evaluationContext);
  });
  afterEach(() => {
    splitClient.destroy();
    provider = undefined;
  });

  test('use default test', async () => {
    let flagName = 'random-non-existent-feature';

    let result = await client.getBooleanValue(flagName, false);
    expect(result).toBe(false);

    let result2 = await client.getBooleanValue(flagName, true);
    expect(result2).toBe(true);

    let defaultString = 'blah';
    let resultString = await client.getStringValue(flagName, defaultString);
    expect(resultString).toBe(defaultString);

    let defaultInt = 100;
    let resultInt = await client.getNumberValue(flagName, defaultInt);
    expect(resultInt).toBe(defaultInt);

    let defaultStructure = {
      foo: 'bar'
    };
    let resultStructure = await client.getObjectValue(flagName, defaultStructure);
    expect(resultStructure).toEqual(defaultStructure);
  });

  test('missing targetingKey test', async () => {
    let details = await client.getBooleanDetails('non-existent-feature', false, { targetingKey: undefined });
    expect(details.value).toBe(false);
    expect(details.errorCode).toBe('TARGETING_KEY_MISSING');
  });

  test('evaluate Boolean control test', async () => {
    let details = await client.getBooleanDetails('non-existent-feature', false);
    expect(details.value).toBe(false);
    expect(details.errorCode).toBe('FLAG_NOT_FOUND');
    expect(details.reason).toBe('ERROR');
  });

  test('evaluate Boolean test', async () => {
    let result = await client.getBooleanValue('some_other_feature', true);
    expect(result).toBe(false);
  });

  test('evaluate Boolean details test', async () => {
    let result = await client.getBooleanDetails('my_feature', false);
    expect(result.value).toBe(true);
    expect(result.flagMetadata).toEqual({ config: '{"desc" : "this applies only to ON treatment"}' });

    result = await client.getBooleanDetails('my_feature', true, { targetingKey: 'randomKey' });
    expect(result.value).toBe(false);
    expect(result.flagMetadata).toEqual({ config: '' });
  });

  test('evaluate String test', async () => {
    let result = await client.getStringValue('some_other_feature', 'on');
    expect(result).toBe('off');
  });

  test('evaluate String details test', async () => {
    let result = await client.getStringDetails('my_feature', 'off');
    expect(result.value).toBe('on');
    expect(result.flagMetadata).toEqual({ config: '{"desc" : "this applies only to ON treatment"}' });

    result = await client.getStringDetails('my_feature', 'on', { targetingKey: 'randomKey' });
    expect(result.value).toBe('off');
    expect(result.flagMetadata).toEqual({ config: '' });
  });

  test('evaluate Number test', async () => {
    let result = await client.getNumberValue('int_feature', 0);
    expect(result).toBe(32);
  });

  test('evaluate Object test', async () => {
    let result = await client.getObjectValue('obj_feature', {});
    expect(result).toEqual({ key: 'value' });
  });

  test('evaluate Metadata name test', async () => {
    expect(client.metadata.name).toBe('test');
  });

  test('evaluate Boolean without details test', async () => {
    let details = await client.getBooleanDetails('some_other_feature', true);
    expect(details.flagKey).toBe('some_other_feature');
    expect(details.reason).toBe('TARGETING_MATCH');
    expect(details.value).toBe(false);
    expect(details.variant).toBe('off');
    expect(details.errorCode).toBeUndefined();
  });

  test('evaluate Number details test', async () => {
    let details = await client.getNumberDetails('int_feature', 0);
    expect(details.flagKey).toBe('int_feature');
    expect(details.reason).toBe('TARGETING_MATCH');
    expect(details.value).toBe(32);
    expect(details.variant).toBe('32');
    expect(details.errorCode).toBeUndefined();
  });

  test('evaluate String without details test', async () => {
    let details = await client.getStringDetails('some_other_feature', 'blah');
    expect(details.flagKey).toBe('some_other_feature');
    expect(details.reason).toBe('TARGETING_MATCH');
    expect(details.value).toBe('off');
    expect(details.variant).toBe('off');
    expect(details.errorCode).toBeUndefined();
  });

  test('evaluate Object details test', async () => {
    let details = await client.getObjectDetails('obj_feature', {});
    expect(details.flagKey).toBe('obj_feature');
    expect(details.reason).toBe('TARGETING_MATCH');
    expect(details.value).toEqual({ key: 'value' });
    expect(details.variant).toBe('{"key": "value"}');
    expect(details.errorCode).toBeUndefined();
  });

  test('evaluate Boolean fail test', async () => {
    let value = await client.getBooleanValue('obj_feature', false);
    expect(value).toBe(false);

    let details = await client.getBooleanDetails('obj_feature', false);
    expect(details.value).toBe(false);
    expect(details.errorCode).toBe('PARSE_ERROR');
    expect(details.reason).toBe('ERROR');
    expect(details.variant).toBeUndefined();
  });

  test('evaluate Number fail test', async () => {
    let value = await client.getNumberValue('obj_feature', 10);
    expect(value).toBe(10);

    let details = await client.getNumberDetails('obj_feature', 10);
    expect(details.value).toBe(10);
    expect(details.errorCode).toBe('PARSE_ERROR');
    expect(details.reason).toBe('ERROR');
    expect(details.variant).toBeUndefined();
  });

  test('evaluate Object fail test', async () => {
    let defaultObject = { foo: 'bar' };
    let value = await client.getObjectValue('int_feature', defaultObject);
    expect(value).toEqual(defaultObject);

    let details = await client.getObjectDetails('int_feature', defaultObject);
    expect(details.value).toEqual(defaultObject);
    expect(details.errorCode).toBe('PARSE_ERROR');
    expect(details.reason).toBe('ERROR');
    expect(details.variant).toBeUndefined();
  });

  test('track: throws when missing eventName', async () => {
    try {
      await client.track('', { targetingKey: 'u1', trafficType: 'user' }, {});
    } catch (e) {
      expect(e.message).toBe('Missing eventName, required to track');
      expect(e.code).toBe('PARSE_ERROR');
    }
  });

  test('track: throws when missing targetingKey', async () => {
    try {
      await client.track('my-event', { trafficType: 'user' }, {});
    } catch (e) {
      expect(e.message).toBe('Missing targetingKey, required to track');
      expect(e.code).toBe('PARSE_ERROR');
    }
  });

  test('track: throws when missing trafficType', async () => {
    try {
      await client.track('my-event', { targetingKey: 'u1' }, {});
    } catch (e) {
      expect(e.message).toBe('Missing trafficType variable, required to track');
      expect(e.code).toBe('INVALID_CONTEXT');
    }
  });

  test('track: without value', async () => {
    const trackSpy = jest.spyOn(splitClient, 'track');
    await client.track('my-event', { targetingKey: 'u1', trafficType: 'user' }, { properties: { prop1: 'value1' } });
    expect(trackSpy).toHaveBeenCalledWith('u1', 'user', 'my-event', undefined, {  prop1: 'value1' });
  });

  test('track: with value', async () => {
    const trackSpy = jest.spyOn(splitClient, 'track');
    await client.track('my-event', { targetingKey: 'u1', trafficType: 'user' }, { value: 9.99, properties: { prop1: 'value1' } });
    expect(trackSpy).toHaveBeenCalledWith('u1', 'user', 'my-event', 9.99, {  prop1: 'value1' });
  });
});
