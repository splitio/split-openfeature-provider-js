import type SplitIO from '@splitsoftware/splitio/types/splitio';
import { getSplitClient } from '../client-resolver';
import { SplitProviderOptions } from '../types';

function createMockSplitClient(): SplitIO.IClient {
  return {
    getTreatmentWithConfig: jest.fn(),
    getStatus: jest.fn(),
    on: jest.fn(),
    track: jest.fn(),
    destroy: jest.fn(),
    Event: {
      SDK_READY: 'init::ready',
      SDK_READY_FROM_CACHE: 'init::cache-ready',
      SDK_READY_TIMED_OUT: 'init::timeout',
      SDK_UPDATE: 'state::update',
    },
  } as unknown as SplitIO.IClient;
}

describe('client-resolver', () => {
  describe('getSplitClient', () => {
    it('returns splitClient when options is SplitProviderOptions with splitClient', () => {
      const mockClient = createMockSplitClient();
      const options = { splitClient: mockClient };
      const client = getSplitClient(options);
      expect(client).toBe(mockClient);
    });

    it('returns client from factory when options has client() method', () => {
      const mockClient = createMockSplitClient();
      const mockFactory = {
        client: jest.fn().mockReturnValue(mockClient),
      };
      const client = getSplitClient(mockFactory as unknown as SplitIO.ISDK);
      expect(mockFactory.client).toHaveBeenCalled();
      expect(client).toBe(mockClient);
    });

    it('falls back to splitClient when options.client() throws', () => {
      const mockClient = createMockSplitClient();
      const mockFactory = {
        client: jest.fn().mockImplementation(() => {
          throw new Error('not a real SDK');
        }),
      };
      const options = { splitClient: mockClient, ...mockFactory };
      const client = getSplitClient(options as SplitProviderOptions);
      expect(client).toBe(mockClient);
    });

    it('creates client from API key when options is string', () => {
      const client = getSplitClient('localhost');
      expect(client).toBeDefined();
      expect(typeof client.getTreatmentWithConfig).toBe('function');
      expect(typeof client.getStatus).toBe('function');
      expect(client.Event).toBeDefined();
      expect(client.Event.SDK_READY).toBeDefined();
      if (typeof client.destroy === 'function') {
        client.destroy();
      }
    });
  });
});
