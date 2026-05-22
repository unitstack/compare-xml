import { describe, it, expect } from 'vitest';
import { compareJSON } from '@compare-json/core';

describe('unordered array comparison', () => {
  it('should treat reordered arrays as equal', () => {
    const result = compareJSON({
      baseJSON: ['a', 'b', 'c'],
      contrastJSON: ['c', 'b', 'a'],
      options: { arrayCompareMethod: 'unordered' },
    });
    expect(result).toEqual([]);
  });

  it('should detect added and deleted elements ignoring order', () => {
    const result = compareJSON({
      baseJSON: ['a', 'b', 'c'],
      contrastJSON: ['a', 'c', 'd'],
      options: { arrayCompareMethod: 'unordered' },
    });
    expect(result).toEqual([
      {
        pathSegments: ['[1]'],
        pathString: '[1]',
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

  it('should return empty for identical arrays', () => {
    const result = compareJSON({
      baseJSON: [1, 2, 3],
      contrastJSON: [1, 2, 3],
      options: { arrayCompareMethod: 'unordered' },
    });
    expect(result).toEqual([]);
  });

  it('should handle empty arrays', () => {
    expect(
      compareJSON({
        baseJSON: [],
        contrastJSON: [],
        options: { arrayCompareMethod: 'unordered' },
      }),
    ).toEqual([]);
  });

  it('should handle no common elements', () => {
    const result = compareJSON({
      baseJSON: [1, 2],
      contrastJSON: [3, 4],
      options: { arrayCompareMethod: 'unordered' },
    });
    expect(result).toEqual([
      {
        pathSegments: ['[0]'],
        pathString: '[0]',
        pathBelongsTo: 'base',
        diffType: 'deleted',
      },
      {
        pathSegments: ['[1]'],
        pathString: '[1]',
        pathBelongsTo: 'base',
        diffType: 'deleted',
      },
      {
        pathSegments: ['[0]'],
        pathString: '[0]',
        pathBelongsTo: 'contrast',
        diffType: 'added',
      },
      {
        pathSegments: ['[1]'],
        pathString: '[1]',
        pathBelongsTo: 'contrast',
        diffType: 'added',
      },
    ]);
  });

  it('should handle duplicate values correctly', () => {
    const result = compareJSON({
      baseJSON: ['a', 'a', 'b'],
      contrastJSON: ['a', 'b', 'b'],
      options: { arrayCompareMethod: 'unordered' },
    });
    expect(result).toEqual([
      {
        pathSegments: ['[1]'],
        pathString: '[1]',
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

  it('should handle objects ignoring order', () => {
    const result = compareJSON({
      baseJSON: [{ id: 1 }, { id: 2 }, { id: 3 }],
      contrastJSON: [{ id: 3 }, { id: 1 }, { id: 2 }],
      options: { arrayCompareMethod: 'unordered' },
    });
    expect(result).toEqual([]);
  });

  it('should handle nested arrays in objects with unordered', () => {
    const result = compareJSON({
      baseJSON: { tags: ['a', 'b', 'c'] },
      contrastJSON: { tags: ['c', 'b', 'a'] },
      options: { arrayCompareMethod: 'unordered' },
    });
    expect(result).toEqual([]);
  });
});
