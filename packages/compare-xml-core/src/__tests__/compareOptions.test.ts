import { describe, it, expect } from 'vitest';
import { compareJSON } from '@compare-json/core';

describe('valueCaseInsensitive', () => {
  it('should treat same-case strings as equal', () => {
    const result = compareJSON({
      baseJSON: 'hello',
      contrastJSON: 'hello',
      options: { valueCaseInsensitive: true },
    });
    expect(result).toEqual([]);
  });

  it('should treat different-case strings as equal', () => {
    const result = compareJSON({
      baseJSON: 'Hello',
      contrastJSON: 'hello',
      options: { valueCaseInsensitive: true },
    });
    expect(result).toEqual([]);
  });

  it('should still detect different string values', () => {
    const result = compareJSON({
      baseJSON: 'hello',
      contrastJSON: 'world',
      options: { valueCaseInsensitive: true },
    });
    expect(result).toEqual([
      {
        pathSegments: [],
        pathString: '',
        pathBelongsTo: 'both',
        diffType: 'valueChanged',
      },
    ]);
  });

  it('should ignore case in object values', () => {
    const result = compareJSON({
      baseJSON: { name: 'Alice' },
      contrastJSON: { name: 'alice' },
      options: { valueCaseInsensitive: true },
    });
    expect(result).toEqual([]);
  });

  it('should ignore case in nested object values', () => {
    const result = compareJSON({
      baseJSON: { user: { name: 'BOB' } },
      contrastJSON: { user: { name: 'bob' } },
      options: { valueCaseInsensitive: true },
    });
    expect(result).toEqual([]);
  });

  it('should ignore case in array string elements', () => {
    const result = compareJSON({
      baseJSON: ['Hello', 'World'],
      contrastJSON: ['hello', 'world'],
      options: { valueCaseInsensitive: true },
    });
    expect(result).toEqual([]);
  });

  it('should ignore case with unordered array method', () => {
    const result = compareJSON({
      baseJSON: ['Hello', 'World'],
      contrastJSON: ['world', 'hello'],
      options: {
        ...{ valueCaseInsensitive: true },
        arrayCompareMethod: 'unordered' as const,
      },
    });
    expect(result).toEqual([]);
  });

  it('should ignore case with LCS array method', () => {
    const result = compareJSON({
      baseJSON: ['a', 'Hello', 'c'],
      contrastJSON: ['hello', 'c', 'd'],
      options: {
        ...{ valueCaseInsensitive: true },
        arrayCompareMethod: 'lcs' as const,
      },
    });
    expect(result).toEqual([
      {
        pathSegments: ['[0]'],
        pathString: '[0]',
        pathBelongsTo: 'base',
        diffType: 'deleted',
      },
      {
        pathSegments: ['[2]'],
        pathString: '[2]',
        pathBelongsTo: 'contrast',
        diffType: 'added',
      },
    ]);
  });

  it('should not ignore case when option is false', () => {
    const result = compareJSON({
      baseJSON: 'Hello',
      contrastJSON: 'hello',
      options: { valueCaseInsensitive: false },
    });
    expect(result).toEqual([
      {
        pathSegments: [],
        pathString: '',
        pathBelongsTo: 'both',
        diffType: 'valueChanged',
      },
    ]);
  });
});

describe('keyCaseInsensitive', () => {
  it('should match keys with different cases', () => {
    const result = compareJSON({
      baseJSON: { Name: 'Alice' },
      contrastJSON: { name: 'Alice' },
      options: { keyCaseInsensitive: true },
    });
    expect(result).toEqual([]);
  });

  it('should match nested keys with different cases', () => {
    const result = compareJSON({
      baseJSON: { User: { Name: 'Alice' } },
      contrastJSON: { user: { name: 'Alice' } },
      options: { keyCaseInsensitive: true },
    });
    expect(result).toEqual([]);
  });

  it('should detect deleted keys case-insensitively', () => {
    const result = compareJSON({
      baseJSON: { a: 1, B: 2 },
      contrastJSON: { A: 1 },
      options: { keyCaseInsensitive: true },
    });
    expect(result).toEqual([
      {
        pathSegments: ['B'],
        pathString: 'B',
        pathBelongsTo: 'base',
        diffType: 'deleted',
      },
    ]);
  });

  it('should detect added keys case-insensitively', () => {
    const result = compareJSON({
      baseJSON: { a: 1 },
      contrastJSON: { A: 1, b: 2 },
      options: { keyCaseInsensitive: true },
    });
    expect(result).toEqual([
      {
        pathSegments: ['b'],
        pathString: 'b',
        pathBelongsTo: 'contrast',
        diffType: 'added',
      },
    ]);
  });

  it('should detect value changes with case-insensitive keys', () => {
    const result = compareJSON({
      baseJSON: { Name: 'old' },
      contrastJSON: { name: 'new' },
      options: { keyCaseInsensitive: true },
    });
    expect(result).toEqual([
      {
        pathSegments: ['Name'],
        pathString: 'Name',
        pathBelongsTo: 'both',
        diffType: 'valueChanged',
      },
    ]);
  });

  it('should work with unordered arrays containing objects', () => {
    const result = compareJSON({
      baseJSON: [{ ID: 1 }, { ID: 2 }],
      contrastJSON: [{ id: 2 }, { id: 1 }],
      options: {
        ...{ keyCaseInsensitive: true },
        arrayCompareMethod: 'unordered' as const,
      },
    });
    expect(result).toEqual([]);
  });

  it('should not ignore case when option is false', () => {
    const result = compareJSON({
      baseJSON: { Name: 'Alice' },
      contrastJSON: { name: 'Alice' },
      options: { keyCaseInsensitive: false },
    });
    expect(result).toEqual([
      {
        pathSegments: ['Name'],
        pathString: 'Name',
        pathBelongsTo: 'base',
        diffType: 'deleted',
      },
      {
        pathSegments: ['name'],
        pathString: 'name',
        pathBelongsTo: 'contrast',
        diffType: 'added',
      },
    ]);
  });

  it('should handle multiple contrast keys mapping to the same lowercase', () => {
    const result = compareJSON({
      baseJSON: { name: 'a', Name: 'b' },
      contrastJSON: { NAME: 'a', name: 'b' },
      options: { keyCaseInsensitive: true },
    });
    expect(result).toEqual([]);
  });

  it('should match each base key to a distinct contrast key', () => {
    const result = compareJSON({
      baseJSON: { name: 'a', Name: 'b' },
      contrastJSON: { NAME: 'a', name: 'b' },
      options: { keyCaseInsensitive: true },
    });
    expect(result).toEqual([]);
  });
});

describe('keyCaseInsensitive and valueCaseInsensitive combined', () => {
  const bothOptions = { keyCaseInsensitive: true, valueCaseInsensitive: true };

  it('should ignore both key and value case', () => {
    const result = compareJSON({
      baseJSON: { Name: 'Alice' },
      contrastJSON: { name: 'alice' },
      options: bothOptions,
    });
    expect(result).toEqual([]);
  });

  it('should handle nested structures with both options', () => {
    const result = compareJSON({
      baseJSON: { User: { Name: 'ALICE', Role: 'ADMIN' } },
      contrastJSON: { user: { name: 'alice', role: 'admin' } },
      options: bothOptions,
    });
    expect(result).toEqual([]);
  });

  it('should still detect truly different values', () => {
    const result = compareJSON({
      baseJSON: { Name: 'Alice' },
      contrastJSON: { name: 'Bob' },
      options: bothOptions,
    });
    expect(result).toEqual([
      {
        pathSegments: ['Name'],
        pathString: 'Name',
        pathBelongsTo: 'both',
        diffType: 'valueChanged',
      },
    ]);
  });

  it('should still detect truly added/deleted keys', () => {
    const result = compareJSON({
      baseJSON: { A: 1, B: 2 },
      contrastJSON: { a: 1, c: 3 },
      options: bothOptions,
    });
    expect(result).toEqual([
      {
        pathSegments: ['B'],
        pathString: 'B',
        pathBelongsTo: 'base',
        diffType: 'deleted',
      },
      {
        pathSegments: ['c'],
        pathString: 'c',
        pathBelongsTo: 'contrast',
        diffType: 'added',
      },
    ]);
  });
});

describe('numericStringEqualsNumber', () => {
  it('should treat numeric string as equal to number when option is true', () => {
    const result = compareJSON({
      baseJSON: '123',
      contrastJSON: 123,
      options: { numericStringEqualsNumber: true },
    });
    expect(result).toEqual([]);
  });

  it('should treat number as equal to numeric string when option is true', () => {
    const result = compareJSON({
      baseJSON: 456,
      contrastJSON: '456',
      options: { numericStringEqualsNumber: true },
    });
    expect(result).toEqual([]);
  });

  it('should treat numeric string as different from number when option is false', () => {
    const result = compareJSON({
      baseJSON: '123',
      contrastJSON: 123,
      options: { numericStringEqualsNumber: false },
    });
    expect(result).toEqual([
      {
        pathSegments: [],
        pathString: '',
        pathBelongsTo: 'both',
        diffType: 'typeChanged',
      },
    ]);
  });

  it('should default to treating numeric string as different from number', () => {
    const result = compareJSON({
      baseJSON: '123',
      contrastJSON: 123,
    });
    expect(result).toEqual([
      {
        pathSegments: [],
        pathString: '',
        pathBelongsTo: 'both',
        diffType: 'typeChanged',
      },
    ]);
  });

  it('should handle floating point numeric strings', () => {
    const result = compareJSON({
      baseJSON: '3.14',
      contrastJSON: 3.14,
      options: { numericStringEqualsNumber: true },
    });
    expect(result).toEqual([]);
  });

  it('should handle negative numeric strings', () => {
    const result = compareJSON({
      baseJSON: '-42',
      contrastJSON: -42,
      options: { numericStringEqualsNumber: true },
    });
    expect(result).toEqual([]);
  });

  it('should handle zero', () => {
    const result = compareJSON({
      baseJSON: '0',
      contrastJSON: 0,
      options: { numericStringEqualsNumber: true },
    });
    expect(result).toEqual([]);
  });

  it('should not treat non-numeric strings as equal to numbers', () => {
    const result = compareJSON({
      baseJSON: 'abc',
      contrastJSON: 123,
      options: { numericStringEqualsNumber: true },
    });
    expect(result).toEqual([
      {
        pathSegments: [],
        pathString: '',
        pathBelongsTo: 'both',
        diffType: 'typeChanged',
      },
    ]);
  });

  it('should work in nested objects', () => {
    const result = compareJSON({
      baseJSON: { count: '100' },
      contrastJSON: { count: 100 },
      options: { numericStringEqualsNumber: true },
    });
    expect(result).toEqual([]);
  });

  it('should work in arrays', () => {
    const result = compareJSON({
      baseJSON: ['1', '2', '3'],
      contrastJSON: [1, 2, 3],
      options: { numericStringEqualsNumber: true },
    });
    expect(result).toEqual([]);
  });

  it('should work with unordered array method', () => {
    const result = compareJSON({
      baseJSON: ['1', '2', '3'],
      contrastJSON: [3, 2, 1],
      options: {
        numericStringEqualsNumber: true,
        arrayCompareMethod: 'unordered' as const,
      },
    });
    expect(result).toEqual([]);
  });

  it('should work with LCS array method', () => {
    const result = compareJSON({
      baseJSON: ['1', '2', '3'],
      contrastJSON: [2, 3, 4],
      options: {
        numericStringEqualsNumber: true,
        arrayCompareMethod: 'lcs' as const,
      },
    });
    expect(result).toEqual([
      {
        pathSegments: ['[0]'],
        pathString: '[0]',
        pathBelongsTo: 'base',
        diffType: 'deleted',
      },
      {
        pathSegments: ['[2]'],
        pathString: '[2]',
        pathBelongsTo: 'contrast',
        diffType: 'added',
      },
    ]);
  });

  it('should still detect different numeric values', () => {
    const result = compareJSON({
      baseJSON: '123',
      contrastJSON: 456,
      options: { numericStringEqualsNumber: true },
    });
    expect(result).toEqual([
      {
        pathSegments: [],
        pathString: '',
        pathBelongsTo: 'both',
        diffType: 'typeChanged',
      },
    ]);
  });
});
