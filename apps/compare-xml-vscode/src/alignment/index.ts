import { pathSegmentsToString } from '@compare-xml/core';
import type { XMLValueDifference } from '@compare-xml/core';
import { xmlToCodeLines } from './codeLine';
import { showXMLCodeWithDifferences, type XMLViewLine } from './codeView';

export interface AlignedDocuments {
  baseText: string;
  contrastText: string;
  /** diff pathString -> 1-based line number in the aligned documents (valid for both sides) */
  lineMap: Map<string, number>;
}

const INDENT = '  ';

export function buildAlignedDocuments({
  baseXML,
  contrastXML,
  differences,
}: {
  baseXML: unknown;
  contrastXML: unknown;
  differences: XMLValueDifference[];
}): AlignedDocuments {
  const [baseViewLines, contrastViewLines] = showXMLCodeWithDifferences({
    xmlCodeLines: xmlToCodeLines({
      xml: baseXML,
      anotherXML: contrastXML,
    }),
    anotherXMLCodeLines: xmlToCodeLines({
      xml: contrastXML,
      anotherXML: baseXML,
    }),
    xmlValueDifferences: differences,
  });

  // Defensive: both sides must end up with the same number of lines.
  while (baseViewLines.length < contrastViewLines.length) {
    baseViewLines.push({ codeLine: undefined, blank: true });
  }
  while (contrastViewLines.length < baseViewLines.length) {
    contrastViewLines.push({ codeLine: undefined, blank: true });
  }

  return {
    baseText: renderViewLines(baseViewLines),
    contrastText: renderViewLines(contrastViewLines),
    lineMap: buildLineMap(differences, baseViewLines, contrastViewLines),
  };
}

function renderViewLines(viewLines: XMLViewLine[]): string {
  return viewLines
    .map((line) =>
      line.codeLine
        ? INDENT.repeat(line.codeLine.depth) + line.codeLine.content
        : '',
    )
    .join('\n');
}

function buildLineMap(
  differences: XMLValueDifference[],
  baseViewLines: XMLViewLine[],
  contrastViewLines: XMLViewLine[],
): Map<string, number> {
  const lineMap = new Map<string, number>();

  for (const diff of differences) {
    const viewLines =
      diff.pathBelongsTo === 'contrast' ? contrastViewLines : baseViewLines;
    const line = findLine(viewLines, diff.pathSegments);

    if (line !== undefined) {
      lineMap.set(diff.pathString, line);
    }
  }

  return lineMap;
}

/**
 * Finds the 1-based line number for a diff path. Falls back to ancestor
 * paths because some paths (attributes, single-line text) share their
 * element's line.
 */
function findLine(
  viewLines: XMLViewLine[],
  pathSegments: string[],
): number | undefined {
  for (let length = pathSegments.length; length > 0; length--) {
    const pathString = pathSegmentsToString(pathSegments.slice(0, length));
    const index = viewLines.findIndex(
      (line) => line.codeLine?.pathString === pathString,
    );

    if (index >= 0) {
      return index + 1;
    }
  }

  return undefined;
}
