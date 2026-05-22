import { readFileSync, existsSync } from 'fs';
import { validateXML } from '@compare-xml/core';

export { getPkgVersion } from './pkg';

export function parseInput(input: string, label: 'base' | 'contrast'): string {
  let xmlInput: {
    from: 'argument' | 'file';
    value: string;
    filePath?: string;
  } = {
    from: 'argument',
    value: input,
  };

  if (existsSync(input)) {
    xmlInput = {
      from: 'file',
      value: readFileSync(input, 'utf-8'),
      filePath: input,
    };
  }

  try {
    validateXML(xmlInput.value);
    return xmlInput.value;
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
      if (xmlInput.from === 'argument') {
        throw new Error(
          `Failed to parse ${label} input: if you passed a file path, the file was not found; if you passed an XML string, it failed to parse. Error: ${xmlError.message}${detail}`,
        );
      } else {
        throw new Error(
          `Failed to parse ${label} file content from ${xmlInput.filePath}, unable to parse as XML. Error: ${xmlError.message}${detail}`,
        );
      }
    }
    throw error;
  }
}
