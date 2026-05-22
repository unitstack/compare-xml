import type { ArrayCompareMethod, CompareOptions } from '@compare-json/core';

export type XMLValueDiffType = 'added' | 'deleted' | 'valueChanged';
export type XMLArrayCompareMethod = ArrayCompareMethod;

export interface XMLCompareOptions {
  arrayCompareMethod?: XMLArrayCompareMethod;
  keyCaseInsensitive?: boolean;
  valueCaseInsensitive?: boolean;
}

export interface XMLValueDifference {
  pathSegments: string[];
  pathString: string;
  pathBelongsTo: 'base' | 'contrast' | 'both';
  diffType: XMLValueDiffType;
}

export function toXMLCompareOptions(
  options?: XMLCompareOptions,
): CompareOptions | undefined {
  if (!options) return undefined;
  return {
    arrayCompareMethod: options.arrayCompareMethod,
    keyCaseInsensitive: options.keyCaseInsensitive,
    valueCaseInsensitive: options.valueCaseInsensitive,
  };
}

export function toXMLDifferences(
  diffs: Array<{
    pathSegments: string[];
    pathString: string;
    pathBelongsTo: 'base' | 'contrast' | 'both';
    diffType: string;
  }>,
): XMLValueDifference[] {
  return diffs.map((d) => ({
    pathSegments: d.pathSegments,
    pathString: d.pathString,
    pathBelongsTo: d.pathBelongsTo,
    diffType:
      d.diffType === 'typeChanged'
        ? 'valueChanged'
        : (d.diffType as XMLValueDiffType),
  }));
}
