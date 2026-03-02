import { OpenFeatureEventEmitter, ProviderEvents } from '@openfeature/server-sdk';
import type SplitIO from '@splitsoftware/splitio/types/splitio';
import { attachReadyEventHandlers, waitUntilReady } from '../readiness';
import { PROVIDER_NAME } from '../types';

interface MockSplitClient {
  Event: { SDK_READY: string; SDK_READY_FROM_CACHE: string; SDK_READY_TIMED_OUT: string };
  getStatus: jest.Mock;
  on: jest.Mock;
  _emit: (event: string, metadata?: unknown) => void;
}

function createMockClient(overrides: Partial<{
  isReady: boolean;
  hasTimedout: boolean;
  readyMetadata: { initialCacheLoad?: boolean; lastUpdateTimestamp?: number };
}> = {}): MockSplitClient {
  const { isReady = false, hasTimedout = false } = overrides;
  const listeners: Record<string, ((...args: unknown[]) => void)[]> = {
    'init::ready': [],
    'init::cache-ready': [],
    'init::timeout': [],
  };
  const mock: MockSplitClient = {
    Event: {
      SDK_READY: 'init::ready',
      SDK_READY_FROM_CACHE: 'init::cache-ready',
      SDK_READY_TIMED_OUT: 'init::timeout',
    },
    getStatus: jest.fn().mockReturnValue({ isReady, hasTimedout }),
    on: jest.fn((event: string, cb: (...args: unknown[]) => void) => {
      if (!listeners[event]) listeners[event] = [];
      listeners[event].push(cb);
      return mock;
    }),
    _emit(event: string, metadata?: unknown) {
      (listeners[event] || []).forEach((cb) => cb(metadata));
    },
  };
  return mock;
}

describe('readiness', () => {
  describe('attachReadyEventHandlers', () => {
    it('emits ProviderEvents.Ready with readyFromCache true when SDK_READY_FROM_CACHE fires', () => {
      const client = createMockClient();
      const events = new OpenFeatureEventEmitter();
      const handler = jest.fn();
      events.addHandler(ProviderEvents.Ready, handler);

      attachReadyEventHandlers(client as unknown as SplitIO.IClient, events, 'split');
      expect(client.on).toHaveBeenCalledWith('init::cache-ready', expect.any(Function));
      expect(client.on).toHaveBeenCalledWith('init::ready', expect.any(Function));

      client._emit('init::cache-ready', {
        initialCacheLoad: true,
        lastUpdateTimestamp: 12345,
      });

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler.mock.calls[0][0]).toMatchObject({
        providerName: 'split',
        metadata: {
          readyFromCache: true,
          initialCacheLoad: true,
          lastUpdateTimestamp: 12345,
        },
      });
    });

    it('emits ProviderEvents.Ready with readyFromCache false when SDK_READY fires', () => {
      const client = createMockClient();
      const events = new OpenFeatureEventEmitter();
      const handler = jest.fn();
      events.addHandler(ProviderEvents.Ready, handler);

      attachReadyEventHandlers(client as unknown as SplitIO.IClient, events);
      client._emit('init::ready', {
        initialCacheLoad: false,
        lastUpdateTimestamp: 99999,
      });

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          providerName: PROVIDER_NAME,
          metadata: expect.objectContaining({
            readyFromCache: false,
            initialCacheLoad: false,
            lastUpdateTimestamp: 99999,
          }),
        })
      );
    });

    it('handles undefined metadata (e.g. consumer/Redis mode)', () => {
      const client = createMockClient();
      const events = new OpenFeatureEventEmitter();
      const handler = jest.fn();
      events.addHandler(ProviderEvents.Ready, handler);

      attachReadyEventHandlers(client as unknown as SplitIO.IClient, events);
      client._emit('init::ready', undefined);

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          providerName: PROVIDER_NAME,
          metadata: expect.objectContaining({
            readyFromCache: false,
            initialCacheLoad: false,
          }),
        })
      );
    });

    it('emits Ready immediately when client is already ready (e.g. localhost or reused client)', () => {
      const client = createMockClient({ isReady: true });
      const events = new OpenFeatureEventEmitter();
      const handler = jest.fn();
      events.addHandler(ProviderEvents.Ready, handler);

      attachReadyEventHandlers(client as unknown as SplitIO.IClient, events);

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler.mock.calls[0][0]).toMatchObject({
        providerName: PROVIDER_NAME,
        metadata: {
          readyFromCache: false,
          initialCacheLoad: false,
        },
      });
    });
  });

  describe('waitUntilReady', () => {
    it('resolves immediately when client is already ready', async () => {
      const client = createMockClient({ isReady: true });
      await expect(waitUntilReady(client as unknown as SplitIO.IClient, new OpenFeatureEventEmitter(), PROVIDER_NAME)).resolves.toBeUndefined();
    });

    it('rejects when client has timed out', async () => {
      const client = createMockClient({ hasTimedout: true });
      await expect(waitUntilReady(client as unknown as SplitIO.IClient, new OpenFeatureEventEmitter(), PROVIDER_NAME)).rejects.toBeUndefined();
    });

    it('resolves when SDK_READY fires', async () => {
      const client = createMockClient({ isReady: false, hasTimedout: false });
      const promise = waitUntilReady(client as unknown as SplitIO.IClient, new OpenFeatureEventEmitter(), PROVIDER_NAME);
      client._emit('init::ready');
      await expect(promise).resolves.toBeUndefined();
    });

    it('rejects when SDK_READY_TIMED_OUT fires', async () => {
      const client = createMockClient({ isReady: false, hasTimedout: false });
      const promise = waitUntilReady(client as unknown as SplitIO.IClient, new OpenFeatureEventEmitter(), PROVIDER_NAME);
      client._emit('init::timeout');
      await expect(promise).rejects.toBeUndefined();
    });
  });
});
