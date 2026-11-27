import type SplitIO from '@splitsoftware/splitio/types/splitio';

/**
 * Options when providing an existing Split client to the provider.
 */
export type SplitProviderOptions = {
  splitClient: SplitIO.IClient | SplitIO.IAsyncClient;
};

/**
 * Why a `bucketingKey` present in the evaluation context was ignored.
 */
export type BucketingKeyIssue = 'blank' | 'not a string';

/**
 * Consumer representation used for Split API calls:
 * targeting key, optional bucketing key, traffic type, and attributes.
 */
export type Consumer = {
  targetingKey: string | undefined;
  /** Valid (non-blank string) bucketing key, trimmed. */
  bucketingKey?: string;
  /** Set when a `bucketingKey` was present but ignored. */
  bucketingKeyIssue?: BucketingKeyIssue;
  trafficType: string;
  attributes: SplitIO.Attributes;
};

/**
 * Union of all constructor argument types for the Split OpenFeature provider.
 */
export type SplitProviderConstructorOptions =
  | SplitProviderOptions
  | string
  | SplitIO.ISDK
  | SplitIO.IAsyncSDK;

export const CONTROL_TREATMENT = 'control';
export const CONTROL_VALUE_ERROR_MESSAGE = 'Received the "control" value from Split.';
export const DEFAULT_TRAFFIC_TYPE = 'user';
export const PROVIDER_NAME = 'split';
