/* eslint-disable jest/no-conditional-expect */
import { ProviderEvents } from '@openfeature/server-sdk';
import { getLocalHostSplitClient, getSplitFactory } from '../testUtils';
import { OpenFeatureSplitProvider } from '../../lib/js-split-provider';

const cases = [
  [
    'provider tests mode: splitClient',
    () => ({ splitClient: getLocalHostSplitClient()}),
    
  ],
  [
    'provider tests mode: splitFactory',
    getSplitFactory
  ],
];

describe.each(cases)('%s', (label, getOptions) => {

  let provider;
  let options;

  beforeEach(() => {
    options = getOptions();
    provider = new OpenFeatureSplitProvider(options);
  });

  afterEach(async () => {
    jest.clearAllMocks()
    await provider.onClose();
  });

  test('evaluate Boolean null/empty test', async () => {
    try {
      await provider.resolveBooleanEvaluation('', false, { targetingKey: 'user1' });
    } catch (e) {
      expect(e.message).toBe('flagKey must be a non-empty string');
      expect(e.code).toBe('FLAG_NOT_FOUND');
    }
  });

  test('evaluate Boolean control test', async () => {
    try {
      await provider.resolveBooleanEvaluation('non-existent-feature', false, { targetingKey: 'user1' });
    } catch (e) {
      expect(e.message).toBe('Received the "control" value from Split.');
      expect(e.code).toBe('FLAG_NOT_FOUND');
    }
  });

  test('evaluate Boolean true test', async () => {
    const details = await provider.resolveBooleanEvaluation('my_feature', false, { targetingKey: 'key' });
    expect(details.value).toBe(true);
    expect(details.variant).toBe('on');
    expect(details.reason).toBe('TARGETING_MATCH');
    expect(details.flagMetadata).toEqual({ config: '{"desc" : "this applies only to ON treatment"}' });
  });

  test('evaluate Boolean on test', async () => {
    const details = await provider.resolveBooleanEvaluation('my_feature', true, { targetingKey: 'key' });
    expect(details.value).toBe(true);
    expect(details.variant).toBe('on');
    expect(details.reason).toBe('TARGETING_MATCH');
    expect(details.flagMetadata).toEqual({ config: '{"desc" : "this applies only to ON treatment"}' });
  });

  test('evaluate Boolean false test', async () => {
    const details = await provider.resolveBooleanEvaluation('some_other_feature', true, { targetingKey: 'user1' });
    expect(details.value).toBe(false);
    expect(details.variant).toBe('off');
    expect(details.reason).toBe('TARGETING_MATCH');
    expect(details.flagMetadata).toEqual({ config: '' });
  });

  test('evaluate Boolean off test', async () => {
    const details = await provider.resolveBooleanEvaluation('some_other_feature', false, { targetingKey: 'user1' });
    expect(details.value).toBe(false);
    expect(details.variant).toBe('off');
    expect(details.reason).toBe('TARGETING_MATCH');
    expect(details.flagMetadata).toEqual({ config: '' });
  });

  test('evaluate Boolean error test', async () => {
    try {
      await provider.resolveBooleanEvaluation('int_feature', false, { targetingKey: 'user1' });
    } catch (e) {
      expect(e.message).toBe('Invalid boolean value for 32');
      expect(e.code).toBe('PARSE_ERROR');
    }
  });

  test('evaluate String null/empty test', async () => {
    try {
      await provider.resolveStringEvaluation('', 'default', { targetingKey: 'user1' });
    } catch (e) {
      expect(e.message).toBe('flagKey must be a non-empty string');
      expect(e.code).toBe('FLAG_NOT_FOUND');
    }
  });

  test('evaluate String control test', async () => {
    try {
      await provider.resolveStringEvaluation('non-existent-feature', 'default', { targetingKey: 'user1' });
    } catch (e) {
      expect(e.message).toBe('Received the "control" value from Split.');
      expect(e.code).toBe('FLAG_NOT_FOUND');
    }
  });

  test('evaluate String regular test', async () => {
    try {
      await provider.resolveStringEvaluation('string_feature', 'default', { targetingKey: 'user1' });
    } catch (e) {
      expect(e.message).toBe('Received the "control" value from Split.');
      expect(e.code).toBe('FLAG_NOT_FOUND');
    }
  });

  test('evaluate String error test', async () => {
    try {
      await provider.resolveStringEvaluation('int_feature', 'default', { targetingKey: 'user1' });
    } catch (e) {
      expect(e.message).toBe('Invalid string value for 32');
      expect(e.code).toBe('PARSE_ERROR');
    }
  });

  test('evaluate Number null/empty test', async () => {
    try {
      await provider.resolveNumberEvaluation('', 0, { targetingKey: 'user1' });
    } catch (e) {
      expect(e.message).toBe('flagKey must be a non-empty string');
      expect(e.code).toBe('FLAG_NOT_FOUND');
    }
  });

  test('evaluate Number control test', async () => {
    try {
      await provider.resolveNumberEvaluation('non-existent-feature', 0, { targetingKey: 'user1' });
    } catch (e) {
      expect(e.message).toBe('Received the "control" value from Split.');
      expect(e.code).toBe('FLAG_NOT_FOUND');
    }
  });

  test('evaluate Number regular test', async () => {
    const details = await provider.resolveNumberEvaluation('int_feature', 0, { targetingKey: 'user1' });
    expect(details.value).toBe(32);
    expect(details.variant).toBe('32');
    expect(details.reason).toBe('TARGETING_MATCH');
    expect(details.flagMetadata).toEqual({ config: '{"desc" : "this applies only to number treatment"}' });
  });

  test('evaluate Number error test', async () => {
    try {
      await provider.resolveNumberEvaluation('my_feature', 0, { targetingKey: 'user1' });
    } catch (e) {
      expect(e.message).toBe('Invalid numeric value off');
      expect(e.code).toBe('PARSE_ERROR');
    }
  });

  test('evaluate Structure null/empty test', async () => {
    try {
      await provider.resolveObjectEvaluation('', {}, { targetingKey: 'user1' });
    } catch (e) {
      expect(e.message).toBe('flagKey must be a non-empty string');
      expect(e.code).toBe('FLAG_NOT_FOUND');
    }
  });

  test('evaluate Structure control test', async () => {
    try {
      await provider.resolveObjectEvaluation('non-existent-feature', {}, { targetingKey: 'user1' });
    } catch (e) {
      expect(e.message).toBe('Received the "control" value from Split.');
      expect(e.code).toBe('FLAG_NOT_FOUND');
    }
  });

  test('evaluate Structure regular test', async () => {
    const details = await provider.resolveObjectEvaluation('obj_feature', {}, { targetingKey: 'user1' });
    expect(details.value).toEqual({ key: 'value' });
    expect(details.variant).toBe('{"key": "value"}');
    expect(details.reason).toBe('TARGETING_MATCH');
    expect(details.flagMetadata).toEqual({ config: '{"desc" : "this applies only to obj treatment"}' });
  });

  test('evaluate Structure error test', async () => {
    try {
      await provider.resolveObjectEvaluation('int_feature', {}, { targetingKey: 'user1' });
    } catch (e) {
      expect(e.message).toBe('Error parsing 32 as JSON, ParseError: Flag value 32 had unexpected type number, expected "object"');
      expect(e.code).toBe('PARSE_ERROR');
    }
  });

  test('track: throws when missing eventName', async () => {
    try {
      await provider.track('', { targetingKey: 'u1', trafficType: 'user' }, {});
    } catch (e) {
      expect(e.message).toBe('Missing eventName, required to track');
      expect(e.code).toBe('PARSE_ERROR');
    }
  });

  test('track: throws when missing trafficType', async () => {
    try {
      await provider.track('evt', { targetingKey: 'u1' }, {});
    } catch (e) {
      expect(e.message).toBe('Missing trafficType variable, required to track');
      expect(e.code).toBe('INVALID_CONTEXT');
    }
  });

  test('track: throws when missing targetingKey', async () => {
    try {
      await provider.track('evt', { trafficType: 'user' }, {});
    } catch (e) {
      expect(e.message).toBe('Missing targetingKey, required to track');
      expect(e.code).toBe('TARGETING_KEY_MISSING');
    }
  });

  test('track: ok without details', async () => {
    const trackSpy = jest.spyOn(options.splitClient ? options.splitClient : options.client(), 'track');
    await provider.track('view', { targetingKey: 'u1', trafficType: 'user' }, null);
    expect(trackSpy).toHaveBeenCalledTimes(1);
    expect(trackSpy).toHaveBeenCalledWith('u1', 'user', 'view', undefined, {});
  });

  test('track: ok with details', async () => {
    const trackSpy = jest.spyOn(options.splitClient ? options.splitClient : options.client(), 'track');
    await provider.track(
      'purchase',
      { targetingKey: 'u1', trafficType: 'user' },
      { value: 9.99, properties: { plan: 'pro', beta: true } }
    );
    expect(trackSpy).toHaveBeenCalledTimes(1);
    expect(trackSpy).toHaveBeenCalledWith('u1', 'user', 'purchase', 9.99, { plan: 'pro', beta: true });
  });
});

describe('provider events metadata', () => {
  const SDK_UPDATE = 'state::update';

  function createMockSplitClient() {
    const listeners = {};
    const mock = {
      Event: { SDK_UPDATE },
      getStatus: jest.fn().mockReturnValue({ isReady: true, hasTimedout: false }),
      getTreatmentWithConfig: jest.fn().mockResolvedValue({ treatment: 'on', config: '' }),
      on: jest.fn((event, cb) => {
        listeners[event] = listeners[event] || [];
        listeners[event].push(cb);
        return mock;
      }),
      track: jest.fn(),
      destroy: jest.fn(),
      _emit(event, payload) {
        (listeners[event] || []).forEach((cb) => cb(payload));
      },
    };
    return mock;
  }

  test('ConfigurationChanged event includes metadata (type, names) and flagsChanged when FLAGS_UPDATE', async () => {
    const mockClient = createMockSplitClient();
    const provider = new OpenFeatureSplitProvider({ splitClient: mockClient });
    const configChangedDetails = [];
    provider.events.addHandler(ProviderEvents.ConfigurationChanged, (details) => configChangedDetails.push(details));

    mockClient._emit(SDK_UPDATE, { type: 'FLAGS_UPDATE', names: ['flag1', 'flag2'] });

    expect(configChangedDetails.length).toBe(1);
    expect(configChangedDetails[0].providerName).toBe('split');
    expect(configChangedDetails[0].metadata).toEqual({ type: 'FLAGS_UPDATE', names: '["flag1","flag2"]' });
    expect(configChangedDetails[0].flagsChanged).toEqual(['flag1', 'flag2']);

    await provider.onClose();
  });

  test('ConfigurationChanged event includes metadata without flagsChanged when SEGMENTS_UPDATE', async () => {
    const mockClient = createMockSplitClient();
    const provider = new OpenFeatureSplitProvider({ splitClient: mockClient });
    const configChangedDetails = [];
    provider.events.addHandler(ProviderEvents.ConfigurationChanged, (details) => configChangedDetails.push(details));

    mockClient._emit(SDK_UPDATE, { type: 'SEGMENTS_UPDATE', names: ['seg1'] });

    expect(configChangedDetails.length).toBe(1);
    expect(configChangedDetails[0].providerName).toBe('split');
    expect(configChangedDetails[0].metadata).toEqual({ type: 'SEGMENTS_UPDATE', names: '["seg1"]' });
    expect(configChangedDetails[0].flagsChanged).toBeUndefined();

    await provider.onClose();
  });

  test('ConfigurationChanged event includes only providerName when SDK_UPDATE payload is undefined', async () => {
    const mockClient = createMockSplitClient();
    const provider = new OpenFeatureSplitProvider({ splitClient: mockClient });
    const configChangedDetails = [];
    provider.events.addHandler(ProviderEvents.ConfigurationChanged, (details) => configChangedDetails.push(details));

    mockClient._emit(SDK_UPDATE, undefined);

    expect(configChangedDetails.length).toBe(1);
    expect(configChangedDetails[0].providerName).toBe('split');
    expect(configChangedDetails[0].metadata).toBeUndefined();
    expect(configChangedDetails[0].flagsChanged).toBeUndefined();

    await provider.onClose();
  });
});
