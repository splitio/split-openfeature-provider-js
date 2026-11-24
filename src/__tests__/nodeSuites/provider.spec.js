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

  test('ConfigurationChanged event includes metadata (type) and flagsChanged when FLAGS_UPDATE', async () => {
    const mockClient = createMockSplitClient();
    const provider = new OpenFeatureSplitProvider({ splitClient: mockClient });
    const configChangedDetails = [];
    provider.events.addHandler(ProviderEvents.ConfigurationChanged, (details) => configChangedDetails.push(details));

    mockClient._emit(SDK_UPDATE, { type: 'FLAGS_UPDATE', names: ['flag1', 'flag2'] });

    expect(configChangedDetails.length).toBe(1);
    expect(configChangedDetails[0].providerName).toBe('split');
    expect(configChangedDetails[0].metadata).toEqual({ type: 'FLAGS_UPDATE' });
    expect(configChangedDetails[0].flagsChanged).toEqual(['flag1', 'flag2']);

    await provider.onClose();
  });

  test('ConfigurationChanged event includes metadata without flagsChanged when SEGMENTS_UPDATE', async () => {
    const mockClient = createMockSplitClient();
    const provider = new OpenFeatureSplitProvider({ splitClient: mockClient });
    const configChangedDetails = [];
    provider.events.addHandler(ProviderEvents.ConfigurationChanged, (details) => configChangedDetails.push(details));

    mockClient._emit(SDK_UPDATE, { type: 'SEGMENTS_UPDATE' });

    expect(configChangedDetails.length).toBe(1);
    expect(configChangedDetails[0].providerName).toBe('split');
    expect(configChangedDetails[0].metadata).toEqual({ type: 'SEGMENTS_UPDATE' });
    expect(configChangedDetails[0].flagsChanged).toEqual([]);

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

describe('bucketingKey', () => {
  function createMockClient(treatment = 'on') {
    return {
      Event: { SDK_UPDATE: 'state::update' },
      getStatus: jest.fn().mockReturnValue({ isReady: true, hasTimedout: false }),
      getTreatmentWithConfig: jest.fn().mockResolvedValue({ treatment, config: '' }),
      on: jest.fn(),
      track: jest.fn(),
      destroy: jest.fn(),
    };
  }
  const createLogger = () => ({ debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() });

  let client;
  let provider;
  let logger;
  beforeEach(() => {
    client = createMockClient();
    provider = new OpenFeatureSplitProvider({ splitClient: client });
    logger = createLogger();
  });
  afterEach(() => provider.onClose());

  test('valid bucketingKey → evaluates with { matchingKey, bucketingKey }', async () => {
    const result = await provider.resolveBooleanEvaluation('f', false, { targetingKey: 'u1', bucketingKey: 'b1', plan: 'pro' }, logger);
    expect(result.value).toBe(true);
    expect(client.getTreatmentWithConfig).toHaveBeenCalledWith({ matchingKey: 'u1', bucketingKey: 'b1' }, 'f', { plan: 'pro' });
    expect(logger.warn).not.toHaveBeenCalled();
  });

  test('padded bucketingKey is trimmed', async () => {
    await provider.resolveStringEvaluation('f', 'x', { targetingKey: 'u1', bucketingKey: ' b1 ' }, logger);
    expect(client.getTreatmentWithConfig).toHaveBeenCalledWith({ matchingKey: 'u1', bucketingKey: 'b1' }, 'f', {});
  });

  test.each([undefined, null])('bucketingKey %p → plain targeting key, no warning', async (value) => {
    await provider.resolveStringEvaluation('f', 'x', { targetingKey: 'u1', bucketingKey: value }, logger);
    expect(client.getTreatmentWithConfig).toHaveBeenCalledWith('u1', 'f', {});
    expect(logger.warn).not.toHaveBeenCalled();
  });

  test.each([
    ['', 'blank'],
    ['   ', 'blank'],
    [1, 'not a string'],
    [true, 'not a string'],
    [{ x: 1 }, 'not a string'],
  ])('invalid bucketingKey %p → targeting key only + one warning (%s)', async (value, reason) => {
    const result = await provider.resolveStringEvaluation('f', 'x', { targetingKey: 'u1', bucketingKey: value }, logger);
    expect(result.value).toBe('on');
    expect(client.getTreatmentWithConfig).toHaveBeenCalledWith('u1', 'f', {});
    expect(logger.warn).toHaveBeenCalledTimes(1);
    const message = logger.warn.mock.calls[0][0];
    expect(message).toContain('bucketingKey');
    expect(message).toContain(reason);
    if (typeof value === 'string' && value !== '') expect(message).not.toContain(`(${value})`);
  });

  test('warning never contains the value', async () => {
    await provider.resolveStringEvaluation('f', 'x', { targetingKey: 'u1', bucketingKey: 12345 }, logger);
    expect(logger.warn.mock.calls[0][0]).not.toContain('12345');
  });

  test('invalid bucketingKey without a logger does not throw', async () => {
    await expect(provider.resolveStringEvaluation('f', 'x', { targetingKey: 'u1', bucketingKey: '' })).resolves.toMatchObject({ value: 'on' });
  });

  test('over-length bucketingKey is passed through; control → FlagNotFoundError', async () => {
    client.getTreatmentWithConfig.mockResolvedValue({ treatment: 'control', config: null });
    const long = 'b'.repeat(251);
    await expect(provider.resolveBooleanEvaluation('f', false, { targetingKey: 'u1', bucketingKey: long }, logger))
      .rejects.toMatchObject({ code: 'FLAG_NOT_FOUND' });
    expect(client.getTreatmentWithConfig).toHaveBeenCalledWith({ matchingKey: 'u1', bucketingKey: long }, 'f', {});
  });

  test.each([
    [{ bucketingKey: 'b1' }],
    [{ targetingKey: '', bucketingKey: 'b1' }],
    [{ targetingKey: '' }],
  ])('missing or empty targetingKey %p → TargetingKeyMissingError', async (context) => {
    await expect(provider.resolveBooleanEvaluation('f', false, context, logger))
      .rejects.toMatchObject({ code: 'TARGETING_KEY_MISSING' });
    expect(client.getTreatmentWithConfig).not.toHaveBeenCalled();
  });

  test('track sends the targeting key only', async () => {
    await provider.track('evt', { targetingKey: 'u1', trafficType: 'user', bucketingKey: 'b1_secret' }, { value: 1, properties: { a: 'x' } });
    expect(client.track).toHaveBeenCalledWith('u1', 'user', 'evt', 1, { a: 'x' });
    expect(JSON.stringify(client.track.mock.calls)).not.toContain('b1_secret');
  });
});

describe('bucketingKey with the localhost SDK', () => {
  test('over-length bucketingKey → real SDK returns control → FLAG_NOT_FOUND', async () => {
    const provider = new OpenFeatureSplitProvider(getSplitFactory());
    await provider.initialize();
    await expect(provider.resolveBooleanEvaluation('my_feature', false, { targetingKey: 'key', bucketingKey: 'b'.repeat(251) }))
      .rejects.toMatchObject({ code: 'FLAG_NOT_FOUND' });
    await expect(provider.resolveBooleanEvaluation('my_feature', false, { targetingKey: 'key', bucketingKey: 'anything' }))
      .resolves.toMatchObject({ value: true });
    await provider.onClose();
  });
});
