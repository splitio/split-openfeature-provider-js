import type { OpenFeatureEventEmitter } from '@openfeature/server-sdk';
import { ProviderEvents } from '@openfeature/server-sdk';
import type SplitIO from '@splitsoftware/splitio/types/splitio';
import { PROVIDER_NAME } from './types';

/**
 * Builds OpenFeature Ready event details including Split SDK ready metadata.
 * Handles Split SDK not passing metadata (e.g. in consumer/Redis mode).
 */
function buildReadyEventDetails(
  providerName: string,
  splitMetadata: SplitIO.SdkReadyMetadata | undefined,
  readyFromCache: boolean
) {
  const metadata: Record<string, string | boolean | number> = {
    readyFromCache,
    initialCacheLoad: splitMetadata?.initialCacheLoad ?? false,
  };
  if (splitMetadata?.lastUpdateTimestamp != null) {
    metadata.lastUpdateTimestamp = splitMetadata.lastUpdateTimestamp;
  }
  return {
    providerName: providerName || PROVIDER_NAME,
    metadata,
  };
}

/**
 * Registers Split SDK_READY and SDK_READY_FROM_CACHE listeners and forwards them
 * as OpenFeature ProviderEvents.Ready with event metadata (initialCacheLoad, lastUpdateTimestamp, readyFromCache).
 * If the client is already ready when attaching (e.g. localhost or reused client), emits Ready once
 * with best-effort metadata so handlers always receive at least one Ready when the client is ready.
 */
export function attachReadyEventHandlers(
  client: SplitIO.IClient | SplitIO.IAsyncClient,
  events: OpenFeatureEventEmitter,
  providerName: string = PROVIDER_NAME
): void {
  client.on(
    client.Event.SDK_READY_FROM_CACHE,
    (splitMetadata: SplitIO.SdkReadyMetadata) => {
      events.emit(
        ProviderEvents.Ready,
        buildReadyEventDetails(providerName, splitMetadata, true)
      );
    }
  );
  client.on(client.Event.SDK_READY, (splitMetadata: SplitIO.SdkReadyMetadata) => {
    events.emit(
      ProviderEvents.Ready,
      buildReadyEventDetails(providerName, splitMetadata, false)
    );
  });

  const status = client.getStatus();
  if (status.isReady) {
    events.emit(
      ProviderEvents.Ready,
      buildReadyEventDetails(providerName, undefined, false)
    );
  }
}

/**
 * Returns a promise that resolves when the Split client is ready (SDK_READY),
 * or rejects if the client has timed out (SDK_READY_TIMED_OUT).
 * Used to gate evaluations until the SDK has synchronized with the backend.
 */
export function waitUntilReady(
  client: SplitIO.IClient | SplitIO.IAsyncClient,
  events: OpenFeatureEventEmitter,
  providerName: string = PROVIDER_NAME
): Promise<void> {
  return new Promise((resolve, reject) => {
    const status = client.getStatus();
    if (status.isReady) {
      emitReadyEvent(client, events, providerName);
      resolve();
      return;
    }
    if (status.hasTimedout) {
      reject();
      return;
    }
    client.on(client.Event.SDK_READY_TIMED_OUT, reject);
    client.on(client.Event.SDK_READY, () => {
      emitReadyEvent(client, events, providerName);
      resolve();
    });
  });
}

export function emitReadyEvent(
  client: SplitIO.IClient | SplitIO.IAsyncClient,
  events: OpenFeatureEventEmitter,
  providerName: string = PROVIDER_NAME
): void {
  events.emit(
    ProviderEvents.Ready,
    buildReadyEventDetails(providerName, undefined, false)
  );
}

