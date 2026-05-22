import { readFileSync, existsSync } from 'fs';
import { validateXML } from '@compare-xml/core';

export { getPkgVersion } from '../pkg';

export function parseInput(
  xml: unknown,
  xmlString: string | undefined,
  xmlFilePath: string | undefined,
  label: 'base' | 'contrast',
): string {
  if (!xml && !xmlString && !xmlFilePath) {
    throw new Error(
      `No ${label} value provided. Please set one of: ${label}XML, ${label}XMLString, or ${label}XMLFilePath`,
    );
  }

  if (xmlFilePath) {
    if (!existsSync(xmlFilePath)) {
      throw new Error(`${label} file not found: ${xmlFilePath}`);
    }
    try {
      const content = readFileSync(xmlFilePath, 'utf-8');
      validateXML(content);
      return content;
    } catch (error) {
      if ((error as Error).name === 'XMLValidationError') {
        const xmlError = error as {
          message: string;
          line?: number;
          col?: number;
        };
        const detail =
          xmlError.line !== undefined
            ? ` (line ${xmlError.line}, col ${xmlError.col})`
            : '';
        throw new Error(
          `Failed to parse ${label} file content from ${xmlFilePath}. Error: ${xmlError.message}${detail}`,
        );
      }
      throw error;
    }
  }

  if (xmlString) {
    try {
      validateXML(xmlString);
      return xmlString;
    } catch (error) {
      if ((error as Error).name === 'XMLValidationError') {
        const xmlError = error as {
          message: string;
          line?: number;
          col?: number;
        };
        const detail =
          xmlError.line !== undefined
            ? ` (line ${xmlError.line}, col ${xmlError.col})`
            : '';
        throw new Error(
          `Failed to parse ${label} XML string. Error: ${xmlError.message}${detail}`,
        );
      }
      throw error;
    }
  }

  if (typeof xml === 'string') {
    validateXML(xml);
    return xml;
  }

  throw new Error(`${label}XML must be a string, received ${typeof xml}`);
}
