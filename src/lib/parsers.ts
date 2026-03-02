import { ParseError } from '@openfeature/server-sdk';
import type { JsonValue } from '@openfeature/server-sdk';

export function parseValidNumber(stringValue: string | undefined): number {
  if (stringValue === undefined) {
    throw new ParseError(`Invalid 'undefined' value.`);
  }
  const result = Number.parseFloat(stringValue);
  if (Number.isNaN(result)) {
    throw new ParseError(`Invalid numeric value ${stringValue}`);
  }
  return result;
}

export function parseValidJsonObject<T extends JsonValue>(
  stringValue: string | undefined
): T {
  if (stringValue === undefined) {
    throw new ParseError(`Invalid 'undefined' JSON value.`);
  }
  try {
    const value = JSON.parse(stringValue);
    if (typeof value !== 'object') {
      throw new ParseError(
        `Flag value ${stringValue} had unexpected type ${typeof value}, expected "object"`
      );
    }
    return value;
  } catch (err) {
    throw new ParseError(`Error parsing ${stringValue} as JSON, ${err}`);
  }
}
