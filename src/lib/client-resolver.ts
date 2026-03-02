import { SplitFactory } from '@splitsoftware/splitio';
import type SplitIO from '@splitsoftware/splitio/types/splitio';
import type { SplitProviderConstructorOptions, SplitProviderOptions } from './types';

/**
 * Resolves the Split client from the various supported constructor option shapes.
 * Supports: API key (string), Split SDK/AsyncSDK (factory), or pre-built splitClient.
 */
export function getSplitClient(
  options: SplitProviderConstructorOptions
): SplitIO.IClient | SplitIO.IAsyncClient {
  if (typeof options === 'string') {
    const splitFactory = SplitFactory({ core: { authorizationKey: options } });
    return splitFactory.client();
  }

  try {
    return (options as SplitIO.ISDK | SplitIO.IAsyncSDK).client();
  } catch {
    return (options as SplitProviderOptions).splitClient;
  }
}
