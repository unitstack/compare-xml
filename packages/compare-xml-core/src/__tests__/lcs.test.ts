import { describe, it, expect } from 'vitest';
import { compareJSON } from '@compare-json/core';

describe('LCS array comparison', () => {
  it('should correctly diff shifted arrays', () => {
    const result = compareJSON({
      baseJSON: ['a', 'b', 'c'],
      contrastJSON: ['b', 'c', 'd'],
      options: { arrayCompareMethod: 'lcs' },
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

  it('should return empty array for identical arrays', () => {
    const result = compareJSON({
      baseJSON: [1, 2, 3],
      contrastJSON: [1, 2, 3],
      options: { arrayCompareMethod: 'lcs' },
    });
    expect(result).toEqual([]);
  });

  it('should handle empty arrays', () => {
    expect(
      compareJSON({
        baseJSON: [],
        contrastJSON: [],
        options: { arrayCompareMethod: 'lcs' },
      }),
    ).toEqual([]);
    expect(
      compareJSON({
        baseJSON: [1],
        contrastJSON: [],
        options: { arrayCompareMethod: 'lcs' },
      }),
    ).toEqual([
      {
        pathSegments: ['[0]'],
        pathString: '[0]',
        pathBelongsTo: 'base',
        diffType: 'deleted',
      },
    ]);
    expect(
      compareJSON({
        baseJSON: [],
        contrastJSON: [1],
        options: { arrayCompareMethod: 'lcs' },
      }),
    ).toEqual([
      {
        pathSegments: ['[0]'],
        pathString: '[0]',
        pathBelongsTo: 'contrast',
        diffType: 'added',
      },
    ]);
  });

  it('should handle no common elements', () => {
    const result = compareJSON({
      baseJSON: [1, 2, 3],
      contrastJSON: [4, 5, 6],
      options: { arrayCompareMethod: 'lcs' },
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
        pathSegments: ['[2]'],
        pathString: '[2]',
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
      {
        pathSegments: ['[2]'],
        pathString: '[2]',
        pathBelongsTo: 'contrast',
        diffType: 'added',
      },
    ]);
  });

  it('should handle objects in arrays', () => {
    const result = compareJSON({
      baseJSON: [{ id: 1 }, { id: 2 }, { id: 3 }],
      contrastJSON: [{ id: 2 }, { id: 3 }, { id: 4 }],
      options: { arrayCompareMethod: 'lcs' },
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

  it('should handle nested arrays with LCS', () => {
    const result = compareJSON({
      baseJSON: { items: ['a', 'b', 'c'] },
      contrastJSON: { items: ['b', 'c', 'd'] },
      options: { arrayCompareMethod: 'lcs' },
    });
    expect(result).toEqual([
      {
        pathSegments: ['items', '[0]'],
        pathString: 'items[0]',
        pathBelongsTo: 'base',
        diffType: 'deleted',
      },
      {
        pathSegments: ['items', '[2]'],
        pathString: 'items[2]',
        pathBelongsTo: 'contrast',
        diffType: 'added',
      },
    ]);
  });

  it('should handle LCS where base has extra middle element', () => {
    const result = compareJSON({
      baseJSON: ['a', 'x', 'b'],
      contrastJSON: ['a', 'b'],
      options: { arrayCompareMethod: 'lcs' as const },
    });
    expect(result).toEqual([
      {
        pathSegments: ['[1]'],
        pathString: '[1]',
        pathBelongsTo: 'base',
        diffType: 'deleted',
      },
    ]);
  });
});
