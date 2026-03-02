import type { EvaluationContext } from '@openfeature/server-sdk';
import type { Consumer } from './types';
import { DEFAULT_TRAFFIC_TYPE } from './types';

/**
 * Transforms OpenFeature evaluation context into the consumer shape used by the Split API:
 * targeting key, traffic type (with default), and remaining attributes.
 */
export function transformContext(
  context: EvaluationContext,
  defaultTrafficType: string = DEFAULT_TRAFFIC_TYPE
): Consumer {
  const { targetingKey, trafficType: ttVal, ...attributes } = context;
  const trafficType =
    ttVal != null && typeof ttVal === 'string' && ttVal.trim() !== ''
      ? ttVal
      : defaultTrafficType;
  return {
    targetingKey,
    trafficType,
    attributes: JSON.parse(JSON.stringify(attributes)),
  };
}
