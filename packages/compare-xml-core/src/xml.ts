import { compareJSON } from '@compare-json/core';
import { XMLParser, XMLValidator } from 'fast-xml-parser';
import { toXMLCompareOptions, toXMLDifferences } from './types';
import type { XMLCompareOptions, XMLValueDifference } from './types';

export const ATTRIBUTE_KEY_PREFIX = '@';

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: ATTRIBUTE_KEY_PREFIX,
  parseAttributeValue: true,
});

export function parseXML(xml: string): unknown {
  return xmlParser.parse(xml);
}

export class XMLValidationError extends Error {
  line?: number;
  col?: number;

  constructor(message: string, line?: number, col?: number) {
    super(message);
    this.name = 'XMLValidationError';
    this.line = line;
    this.col = col;
  }
}

export function validateXML(xml: string): void {
  if (!xml.trim()) {
    throw new XMLValidationError('XML is empty');
  }

  const res = XMLValidator.validate(xml);

  if (res !== true) {
    throw new XMLValidationError(res.err.msg, res.err.line, res.err.col);
  }
}

export function compareXML({
  baseXML,
  contrastXML,
  options,
}: {
  baseXML: string;
  contrastXML: string;
  options?: XMLCompareOptions;
}): XMLValueDifference[] {
  let baseJSON: unknown;
  let contrastJSON: unknown;

  try {
    baseJSON = parseXML(baseXML);
  } catch (error) {
    throw new XMLValidationError(
      `Failed to parse base XML: ${(error as Error).message}`,
    );
  }

  try {
    contrastJSON = parseXML(contrastXML);
  } catch (error) {
    throw new XMLValidationError(
      `Failed to parse contrast XML: ${(error as Error).message}`,
    );
  }

  const rawDifferences = compareJSON({
    baseJSON,
    contrastJSON,
    options: toXMLCompareOptions(options),
  });

  return toXMLDifferences(rawDifferences);
}
