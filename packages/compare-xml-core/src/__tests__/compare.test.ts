import { describe, it, expect } from 'vitest';
import { compareJSON } from '@compare-json/core';

describe('primitive value comparison', () => {
  it('should return empty array for same values', () => {
    expect(compareJSON({ baseJSON: 'test', contrastJSON: 'test' })).toEqual([]);
    expect(compareJSON({ baseJSON: 123, contrastJSON: 123 })).toEqual([]);
    expect(compareJSON({ baseJSON: true, contrastJSON: true })).toEqual([]);
    expect(compareJSON({ baseJSON: null, contrastJSON: null })).toEqual([]);
  });

  it('should detect value changes', () => {
    const result = compareJSON({ baseJSON: 'old', contrastJSON: 'new' });
    expect(result).toEqual([
      {
        pathSegments: [],
        pathString: '',
        pathBelongsTo: 'both',
        diffType: 'valueChanged',
      },
    ]);
  });

  it('should detect type changes', () => {
    const result = compareJSON({
      baseJSON: 'string',
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
});

describe('object comparison', () => {
  it('should detect deleted keys', () => {
    const result = compareJSON({
      baseJSON: { a: 1, b: 2 },
      contrastJSON: { a: 1 },
    });
    expect(result).toEqual([
      {
        pathSegments: ['b'],
        pathString: 'b',
        pathBelongsTo: 'base',
        diffType: 'deleted',
      },
    ]);
  });

  it('should detect added keys', () => {
    const result = compareJSON({
      baseJSON: { a: 1 },
      contrastJSON: { a: 1, b: 2 },
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

  it('should detect value changes in nested objects', () => {
    const result = compareJSON({
      baseJSON: { nested: { value: 'old' } },
      contrastJSON: { nested: { value: 'new' } },
    });
    expect(result).toEqual([
      {
        pathSegments: ['nested', 'value'],
        pathString: 'nested.value',
        pathBelongsTo: 'both',
        diffType: 'valueChanged',
      },
    ]);
  });

  it('should handle multiple differences in objects', () => {
    const result = compareJSON({
      baseJSON: { a: 1, b: 'old', c: true },
      contrastJSON: { a: 1, b: 'new', d: false },
    });
    expect(result).toEqual([
      {
        pathSegments: ['b'],
        pathString: 'b',
        pathBelongsTo: 'both',
        diffType: 'valueChanged',
      },
      {
        pathSegments: ['c'],
        pathString: 'c',
        pathBelongsTo: 'base',
        diffType: 'deleted',
      },
      {
        pathSegments: ['d'],
        pathString: 'd',
        pathBelongsTo: 'contrast',
        diffType: 'added',
      },
    ]);
  });
});

describe('array comparison', () => {
  it('should detect deleted elements', () => {
    const result = compareJSON({
      baseJSON: [1, 2, 3],
      contrastJSON: [1, 2],
    });
    expect(result).toEqual([
      {
        pathSegments: ['[2]'],
        pathString: '[2]',
        pathBelongsTo: 'base',
        diffType: 'deleted',
      },
    ]);
  });

  it('should detect added elements', () => {
    const result = compareJSON({
      baseJSON: [1, 2],
      contrastJSON: [1, 2, 3],
    });
    expect(result).toEqual([
      {
        pathSegments: ['[2]'],
        pathString: '[2]',
        pathBelongsTo: 'contrast',
        diffType: 'added',
      },
    ]);
  });

  it('should detect value changes in array elements', () => {
    const result = compareJSON({
      baseJSON: [1, 'old', true],
      contrastJSON: [1, 'new', true],
    });
    expect(result).toEqual([
      {
        pathSegments: ['[1]'],
        pathString: '[1]',
        pathBelongsTo: 'both',
        diffType: 'valueChanged',
      },
    ]);
  });

  it('should handle nested arrays', () => {
    const result = compareJSON({
      baseJSON: [
        [1, 2],
        [3, 4],
      ],
      contrastJSON: [
        [1, 2],
        [3, '5'],
      ],
    });
    expect(result).toEqual([
      {
        pathSegments: ['[1]', '[1]'],
        pathString: '[1][1]',
        pathBelongsTo: 'both',
        diffType: 'typeChanged',
      },
    ]);
  });

  it('should handle multiple differences in arrays', () => {
    const result = compareJSON({
      baseJSON: [1, 2, { num: '3' }],
      contrastJSON: [1, 'changed', { num: '4' }, 5],
    });
    expect(result).toEqual([
      {
        pathSegments: ['[1]'],
        pathString: '[1]',
        pathBelongsTo: 'both',
        diffType: 'typeChanged',
      },
      {
        pathSegments: ['[2]', 'num'],
        pathString: '[2].num',
        pathBelongsTo: 'both',
        diffType: 'valueChanged',
      },
      {
        pathSegments: ['[3]'],
        pathString: '[3]',
        pathBelongsTo: 'contrast',
        diffType: 'added',
      },
    ]);
  });
});
