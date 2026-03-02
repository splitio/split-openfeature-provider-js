import { ParseError } from '@openfeature/server-sdk';
import { parseValidNumber, parseValidJsonObject } from '../parsers';

describe('parsers', () => {
  describe('parseValidNumber', () => {
    it('returns parsed number for valid string', () => {
      expect(parseValidNumber('0')).toBe(0);
      expect(parseValidNumber('42')).toBe(42);
      expect(parseValidNumber('-1')).toBe(-1);
      expect(parseValidNumber('3.14')).toBe(3.14);
      expect(parseValidNumber('1e2')).toBe(100);
    });

    it('throws ParseError for undefined', () => {
      expect(() => parseValidNumber(undefined)).toThrow(ParseError);
      expect(() => parseValidNumber(undefined)).toThrow("Invalid 'undefined' value.");
    });

    it('throws ParseError for non-numeric string', () => {
      expect(() => parseValidNumber('')).toThrow(ParseError);
      expect(() => parseValidNumber('abc')).toThrow(ParseError);
      expect(() => parseValidNumber('NaN')).toThrow(ParseError);
    });

    it('throws with message containing the invalid value', () => {
      expect(() => parseValidNumber('foo')).toThrow('Invalid numeric value foo');
    });
  });

  describe('parseValidJsonObject', () => {
    it('returns parsed object for valid JSON object string', () => {
      expect(parseValidJsonObject('{}')).toEqual({});
      expect(parseValidJsonObject('{"a":1}')).toEqual({ a: 1 });
      expect(parseValidJsonObject('{"nested":{"b":2}}')).toEqual({
        nested: { b: 2 },
      });
      expect(parseValidJsonObject('[]')).toEqual([]);
    });

    it('throws ParseError for undefined', () => {
      expect(() => parseValidJsonObject(undefined)).toThrow(ParseError);
      expect(() => parseValidJsonObject(undefined)).toThrow(
        "Invalid 'undefined' JSON value."
      );
    });

    it('throws ParseError for non-object JSON (string, number, boolean)', () => {
      expect(() => parseValidJsonObject('"hello"')).toThrow(ParseError);
      expect(() => parseValidJsonObject('42')).toThrow(ParseError);
      expect(() => parseValidJsonObject('true')).toThrow(ParseError);
    });

    it('throws with message indicating expected object type', () => {
      expect(() => parseValidJsonObject('"x"')).toThrow('expected "object"');
    });

    it('throws ParseError for invalid JSON', () => {
      expect(() => parseValidJsonObject('{')).toThrow(ParseError);
      expect(() => parseValidJsonObject('not json')).toThrow(ParseError);
      expect(() => parseValidJsonObject('{"unclosed":')).toThrow(ParseError);
    });
  });
});
