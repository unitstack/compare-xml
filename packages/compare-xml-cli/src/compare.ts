import {
  compareXML,
  type XMLArrayCompareMethod,
  type XMLValueDifference,
} from '@compare-xml/core';
import { writeFileSync } from 'fs';
import { parseInput } from './utils';

const ROOT_LABEL = '(Root)';

export interface CompareOptions {
  arrayCompareMethod?: XMLArrayCompareMethod;
  keyCaseInsensitive?: boolean;
  valueCaseInsensitive?: boolean;
  jsonExport?: boolean;
  output?: string;
}

export function compare(
  base: string,
  contrast: string,
  {
    arrayCompareMethod = 'byIndex',
    keyCaseInsensitive,
    valueCaseInsensitive,
    jsonExport,
    output: outputPath,
  }: CompareOptions = {},
) {
  let baseXML: string;
  let contrastXML: string;

  try {
    baseXML = parseInput(base, 'base');
  } catch (error) {
    console.error(`Error: ${(error as Error).message}`);
    process.exit(1);
    return;
  }

  try {
    contrastXML = parseInput(contrast, 'contrast');
  } catch (error) {
    console.error(`Error: ${(error as Error).message}`);
    process.exit(1);
    return;
  }

  let differences: XMLValueDifference[];
  try {
    differences = compareXML({
      baseXML,
      contrastXML,
      options: {
        arrayCompareMethod,
        keyCaseInsensitive,
        valueCaseInsensitive,
      },
    });
  } catch (error) {
    if ((error as Error).name === 'XMLValidationError') {
      console.error(`Error: ${(error as Error).message}`);
      process.exit(1);
      return;
    }
    throw error;
  }

  let output: string;
  if (jsonExport) {
    output = JSON.stringify(differences, null, 2);
  } else {
    output = formatTable(differences);
  }

  if (outputPath) {
    writeFileSync(outputPath, output, 'utf-8');
    console.log(`Output written to ${outputPath}`);
  } else {
    console.log(output);
  }
}

export function formatTable(differences: XMLValueDifference[]): string {
  if (differences.length === 0) {
    return 'No differences found';
  }

  const rows = differences.map((d) => {
    let keyStr = '';

    if (d.pathSegments.length === 0) {
      keyStr = ROOT_LABEL;
    } else {
      const keyPrefix =
        d.pathBelongsTo === 'contrast' ? '(Contrast)' : '(Base)';
      keyStr = `${keyPrefix} ${d.pathString}`;
    }

    return [keyStr, d.diffType] as string[];
  });
  const maxKeyLen = Math.max(...rows.map((r) => r[0].length), 'Key'.length);
  const maxTypeLen = Math.max(
    ...rows.map((r) => r[1].length),
    'Change Type'.length,
  );

  const topBorder = `┌${'─'.repeat(maxKeyLen + 2)}┬${'─'.repeat(maxTypeLen + 2)}┐`;
  const header = `│ ${'Key'.padEnd(maxKeyLen)} │ ${'Change Type'.padEnd(maxTypeLen)} │`;
  const separator = `├${'─'.repeat(maxKeyLen + 2)}┼${'─'.repeat(maxTypeLen + 2)}┤`;
  const bottomBorder = `└${'─'.repeat(maxKeyLen + 2)}┴${'─'.repeat(maxTypeLen + 2)}┘`;

  return [
    topBorder,
    header,
    separator,
    ...rows.map(
      (r) => `│ ${r[0].padEnd(maxKeyLen)} │ ${r[1].padEnd(maxTypeLen)} │`,
    ),
    bottomBorder,
  ].join('\n');
}
