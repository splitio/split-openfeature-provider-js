import { transformContext } from '../context';
import { DEFAULT_TRAFFIC_TYPE } from '../types';

describe('context', () => {
  describe('transformContext', () => {
    it('extracts targetingKey and uses default traffic type when missing', () => {
      const context = { targetingKey: 'user-123' };
      const result = transformContext(context);
      expect(result.targetingKey).toBe('user-123');
      expect(result.trafficType).toBe(DEFAULT_TRAFFIC_TYPE);
      expect(result.attributes).toEqual({});
    });

    it('uses provided traffic type when present and non-empty', () => {
      const context = {
        targetingKey: 'user-1',
        trafficType: 'account',
      };
      const result = transformContext(context);
      expect(result.trafficType).toBe('account');
      expect(result.targetingKey).toBe('user-1');
      expect(result.attributes).toEqual({});
    });

    it('uses default traffic type when trafficType is empty string', () => {
      const context = {
        targetingKey: 'user-1',
        trafficType: '',
      };
      const result = transformContext(context);
      expect(result.trafficType).toBe(DEFAULT_TRAFFIC_TYPE);
    });

    it('uses default traffic type when trafficType is whitespace', () => {
      const context = {
        targetingKey: 'user-1',
        trafficType: '   ',
      };
      const result = transformContext(context);
      expect(result.trafficType).toBe(DEFAULT_TRAFFIC_TYPE);
    });

    it('passes remaining context as attributes', () => {
      const context = {
        targetingKey: 'user-1',
        trafficType: 'user',
        plan: 'premium',
        region: 'us-east',
      };
      const result = transformContext(context);
      expect(result.attributes).toEqual({ plan: 'premium', region: 'us-east' });
    });

    it('uses custom defaultTrafficType when provided', () => {
      const context = { targetingKey: 'key' };
      const result = transformContext(context, 'custom');
      expect(result.trafficType).toBe('custom');
    });

    it('handles context with only targetingKey and extra attributes', () => {
      const context = {
        targetingKey: 'anon',
        customAttr: 'value',
        count: 42,
      };
      const result = transformContext(context);
      expect(result.targetingKey).toBe('anon');
      expect(result.trafficType).toBe(DEFAULT_TRAFFIC_TYPE);
      expect(result.attributes).toEqual({ customAttr: 'value', count: 42 });
    });
  });
});

describe('transformContext bucketingKey', () => {
  it('reads a valid bucketingKey and does not forward it as an attribute', () => {
    const result = transformContext({ targetingKey: 'u1', bucketingKey: 'b1', plan: 'pro' });
    expect(result.bucketingKey).toBe('b1');
    expect(result.bucketingKeyIssue).toBeUndefined();
    expect(result.attributes).toEqual({ plan: 'pro' });
  });

  it('trims surrounding whitespace', () => {
    const result = transformContext({ targetingKey: 'u1', bucketingKey: ' b1 ' });
    expect(result.bucketingKey).toBe('b1');
    expect(result.bucketingKeyIssue).toBeUndefined();
  });

  it.each([undefined, null])('treats %p as absent, with no issue', (value) => {
    const result = transformContext({ targetingKey: 'u1', bucketingKey: value } as never);
    expect(result).not.toHaveProperty('bucketingKey');
    expect(result.bucketingKeyIssue).toBeUndefined();
    expect(result.attributes).toEqual({});
  });

  it.each([
    ['', 'blank'],
    ['   ', 'blank'],
    [1, 'not a string'],
    [true, 'not a string'],
    [{ x: 1 }, 'not a string'],
  ])('ignores %p with issue %p and strips it from attributes', (value, issue) => {
    const result = transformContext({ targetingKey: 'u1', bucketingKey: value } as never);
    expect(result.bucketingKey).toBeUndefined();
    expect(result.bucketingKeyIssue).toBe(issue);
    expect(result.attributes).toEqual({});
  });

  it('keeps BucketingKey and bucketing_key as plain attributes', () => {
    const result = transformContext({ targetingKey: 'u1', BucketingKey: 'x', bucketing_key: 'y' });
    expect(result.bucketingKey).toBeUndefined();
    expect(result.bucketingKeyIssue).toBeUndefined();
    expect(result.attributes).toEqual({ BucketingKey: 'x', bucketing_key: 'y' });
  });
});
