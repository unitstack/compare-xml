import {
  getValueType,
  pathSegmentsToString,
  ATTRIBUTE_KEY_PREFIX,
} from '@compare-xml/core';

export interface XMLCodeLine {
  pathSegments: string[];
  pathString: string;
  /** element nesting depth, used for indentation */
  depth: number;
  startLineNumber: number;
  endLineNumber: number;
  content: string;
}

const TEXT_KEY = '#text';

export function xmlToCodeLines({
  xml,
  anotherXML,
}: {
  xml: unknown;
  anotherXML: unknown;
}): XMLCodeLine[] {
  if (getValueType(xml) !== 'object') {
    return [];
  }

  const lines: XMLCodeLine[] = [];
  let lineNumber = 1;

  for (const key of Object.keys(xml as Record<string, unknown>)) {
    const childLines = elementToCodeLines({
      name: key,
      value: (xml as Record<string, unknown>)[key],
      anotherXML,
      pathSegments: [key],
      depth: 0,
      startLineNumber: lineNumber,
    });

    lines.push(...childLines);
    lineNumber += childLines.length;
  }

  return lines;
}

function getAtPath(xml: unknown, pathSegments: string[]): unknown {
  let current: unknown = xml;

  for (const segment of pathSegments) {
    if (current === null || current === undefined) {
      return undefined;
    }

    const match = /^\[(\d+)\]$/.exec(segment);
    const key: string | number = match ? Number(match[1]) : segment;
    current = (current as Record<string | number, unknown>)[key];
  }

  return current;
}

function isAttributeKey(key: string): boolean {
  return key.startsWith(ATTRIBUTE_KEY_PREFIX);
}

function childElementKeys(value: Record<string, unknown>): string[] {
  return Object.keys(value).filter(
    (key) => !isAttributeKey(key) && key !== TEXT_KEY,
  );
}

/** Whether the value renders as more than one line (open/close tag on separate lines). */
function rendersMultiLine(value: unknown): boolean {
  const type = getValueType(value);

  if (type === 'array') {
    const items = value as unknown[];
    return items.length > 0 && rendersMultiLine(items[0]);
  }

  if (type === 'object') {
    return childElementKeys(value as Record<string, unknown>).length > 0;
  }

  return false;
}

function formatAttributes(value: Record<string, unknown>): string {
  return Object.keys(value)
    .filter(isAttributeKey)
    .map(
      (key) =>
        ` ${key.slice(ATTRIBUTE_KEY_PREFIX.length)}="${escapeAttribute(value[key])}"`,
    )
    .join('');
}

function escapeText(value: unknown): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeAttribute(value: unknown): string {
  return escapeText(value).replace(/"/g, '&quot;');
}

function elementToCodeLines({
  name,
  value,
  anotherXML,
  pathSegments,
  depth,
  startLineNumber,
}: {
  name: string;
  value: unknown;
  anotherXML: unknown;
  pathSegments: string[];
  depth: number;
  startLineNumber: number;
}): XMLCodeLine[] {
  const type = getValueType(value);

  if (type === 'array') {
    const lines: XMLCodeLine[] = [];
    let lineNumber = startLineNumber;

    (value as unknown[]).forEach((item, index) => {
      const itemLines = elementToCodeLines({
        name,
        value: item,
        anotherXML,
        pathSegments: pathSegments.concat([`[${index}]`]),
        depth,
        startLineNumber: lineNumber,
      });

      lines.push(...itemLines);
      lineNumber += itemLines.length;
    });

    return lines;
  }

  const pathString = pathSegmentsToString(pathSegments);

  if (type !== 'object') {
    return [
      {
        pathSegments,
        pathString,
        depth,
        content: `<${name}>${escapeText(value)}</${name}>`,
        startLineNumber,
        endLineNumber: startLineNumber,
      },
    ];
  }

  const record = value as Record<string, unknown>;
  const attributes = formatAttributes(record);
  const text = record[TEXT_KEY];
  const childKeys = childElementKeys(record);

  if (childKeys.length === 0) {
    const singleLine: XMLCodeLine = {
      pathSegments,
      pathString,
      depth,
      content:
        text === undefined
          ? `<${name}${attributes}></${name}>`
          : `<${name}${attributes}>${escapeText(text)}</${name}>`,
      startLineNumber,
      endLineNumber: startLineNumber,
    };

    // Split open/close tags when the other side renders this element
    // multi-line, so replaced regions line up.
    const valueInAnotherXML = getAtPath(anotherXML, pathSegments);

    if (!rendersMultiLine(valueInAnotherXML)) {
      return [singleLine];
    }

    return [
      {
        ...singleLine,
        content: `<${name}${attributes}>`,
        endLineNumber: startLineNumber + 1,
      },
      {
        pathSegments,
        pathString,
        depth,
        content: `</${name}>`,
        startLineNumber: startLineNumber + 1,
        endLineNumber: startLineNumber + 1,
      },
    ];
  }

  const lines: XMLCodeLine[] = [
    {
      pathSegments,
      pathString,
      depth,
      content: `<${name}${attributes}>`,
      startLineNumber,
      endLineNumber: startLineNumber,
    },
  ];
  let lineNumber = startLineNumber;

  if (text !== undefined) {
    lineNumber += 1;
    lines.push({
      pathSegments: pathSegments.concat([TEXT_KEY]),
      pathString: pathSegmentsToString(pathSegments.concat([TEXT_KEY])),
      depth: depth + 1,
      content: escapeText(text),
      startLineNumber: lineNumber,
      endLineNumber: lineNumber,
    });
  }

  for (const childKey of childKeys) {
    const childLines = elementToCodeLines({
      name: childKey,
      value: record[childKey],
      anotherXML,
      pathSegments: pathSegments.concat([childKey]),
      depth: depth + 1,
      startLineNumber: lineNumber + 1,
    });

    lines.push(...childLines);
    lineNumber += childLines.length;
  }

  const endLineNumber = lineNumber + 1;
  lines[0].endLineNumber = endLineNumber;
  lines.push({
    pathSegments,
    pathString,
    depth,
    content: `</${name}>`,
    startLineNumber: endLineNumber,
    endLineNumber,
  });

  return lines;
}
