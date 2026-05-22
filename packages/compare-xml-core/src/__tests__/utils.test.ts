import { describe, it, expect } from 'vitest';
import { getValueType, pathSegmentsToString } from '@/utils';

describe('utils', () => {
  describe('getValueType', () => {
    it('should return correct types for primitive values', () => {
      expect(getValueType('string')).toBe('string');
      expect(getValueType(123)).toBe('number');
      expect(getValueType(true)).toBe('boolean');
      expect(getValueType(null)).toBe('null');
      expect(getValueType(undefined)).toBe('undefined');
    });

    it('should return correct types for complex values', () => {
      expect(getValueType({})).toBe('object');
      expect(getValueType([])).toBe('array');
      expect(getValueType({ key: 'value' })).toBe('object');
      expect(getValueType([1, 2, 3])).toBe('array');
    });
  });

  describe('pathSegmentsToString', () => {
    it('should return empty string for empty path segments', () => {
      expect(pathSegmentsToString([])).toBe('');
    });

    it('should format simple path correctly', () => {
      expect(pathSegmentsToString(['a'])).toBe('a');
    });

    it('should format path with mixed segments', () => {
      expect(
        pathSegmentsToString(['root', '[123]', 'key', '456', 'subkey']),
      ).toBe('root[123].key.456.subkey');
    });
  });
});
