import type { EvaluationContext } from '@openfeature/server-sdk';
import type { BucketingKeyIssue, Consumer } from './types.js';
import { DEFAULT_TRAFFIC_TYPE } from './types.js';

function readBucketingKey(
  value: unknown
): { bucketingKey?: string; bucketingKeyIssue?: BucketingKeyIssue } {
  if (value == null) return {};
  if (typeof value !== 'string') return { bucketingKeyIssue: 'not a string' };
  const bucketingKey = value.trim();
  if (bucketingKey === '') return { bucketingKeyIssue: 'blank' };
  return { bucketingKey };
}

/**
 * Transforms OpenFeature evaluation context into the consumer shape used by the Split API:
 * targeting key, bucketing key (validated, trimmed), traffic type (with default),
 * and remaining attributes. `bucketingKey` is never forwarded as an attribute.
 */
export function transformContext(
  context: EvaluationContext,
  defaultTrafficType: string = DEFAULT_TRAFFIC_TYPE
): Consumer {
  const { targetingKey, bucketingKey, trafficType: ttVal, ...attributes } = context;
  const trafficType =
    ttVal != null && typeof ttVal === 'string' && ttVal.trim() !== ''
      ? ttVal
      : defaultTrafficType;
  return {
    targetingKey,
    ...readBucketingKey(bucketingKey),
    trafficType,
    attributes: JSON.parse(JSON.stringify(attributes)),
  };
}
