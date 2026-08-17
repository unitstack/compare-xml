import {
  compareXML,
  parseXML,
  validateXML,
  XMLValidationError,
  type XMLCompareOptions,
  type XMLValueDifference,
} from '@compare-xml/core';
import { buildAlignedDocuments } from '../alignment';

export interface SourceText {
  label: string;
  text: string;
}

export interface SessionData {
  base: SourceText;
  contrast: SourceText;
  options: Required<XMLCompareOptions>;
  differences: XMLValueDifference[];
  baseAlignedText: string;
  contrastAlignedText: string;
  /** diff pathString -> 1-based line number in the aligned documents (valid for both sides) */
  lineMap: Map<string, number>;
}

export function computeSession(
  base: SourceText,
  contrast: SourceText,
  options: Required<XMLCompareOptions>,
): SessionData {
  validateSource(base);
  validateSource(contrast);

  const differences = compareXML({
    baseXML: base.text,
    contrastXML: contrast.text,
    options,
  });
  const { baseText, contrastText, lineMap } = buildAlignedDocuments({
    baseXML: parseXML(base.text),
    contrastXML: parseXML(contrast.text),
    differences,
  });

  return {
    base,
    contrast,
    options,
    differences,
    baseAlignedText: baseText,
    contrastAlignedText: contrastText,
    lineMap,
  };
}

function validateSource(source: SourceText): void {
  try {
    validateXML(source.text);
  } catch (error) {
    if (error instanceof XMLValidationError) {
      const location =
        error.line !== undefined
          ? ` at line ${error.line}${error.col !== undefined ? `, column ${error.col}` : ''}`
          : '';

      throw new Error(
        `Invalid XML in ${source.label}${location}: ${error.message}`,
      );
    }

    throw error;
  }
}
