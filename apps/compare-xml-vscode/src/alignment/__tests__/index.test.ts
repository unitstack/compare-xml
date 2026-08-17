import { describe, expect, it } from 'vitest';
import { compareXML, parseXML } from '@compare-xml/core';
import { buildAlignedDocuments } from '@/alignment';

function aligned(base: string, contrast: string) {
  const differences = compareXML({ baseXML: base, contrastXML: contrast });
  return buildAlignedDocuments({
    baseXML: parseXML(base),
    contrastXML: parseXML(contrast),
    differences,
  });
}

describe('buildAlignedDocuments', () => {
  it('produces aligned, indented documents and a line map for each diff', () => {
    const { baseText, contrastText, lineMap } = aligned(
      '<user><name>Alice</name><age>30</age></user>',
      '<user><name>Bob</name><age>31</age><email>bob@test.com</email></user>',
    );

    expect(baseText).toBe(
      '<user>\n  <name>Alice</name>\n  <age>30</age>\n\n</user>',
    );
    expect(contrastText).toBe(
      '<user>\n  <name>Bob</name>\n  <age>31</age>\n  <email>bob@test.com</email>\n</user>',
    );
    expect(baseText.split('\n')).toHaveLength(contrastText.split('\n').length);
    expect(Object.fromEntries(lineMap)).toEqual({
      'user.name': 2,
      'user.age': 3,
      'user.email': 4,
    });
  });

  it('maps attribute diffs to their element line (ancestor fallback)', () => {
    const { baseText, contrastText, lineMap } = aligned(
      '<a id="1">x</a>',
      '<a id="2">x</a>',
    );

    expect(baseText).toBe('<a id="1">x</a>');
    expect(contrastText).toBe('<a id="2">x</a>');
    expect(lineMap.get('a.@id')).toBe(1);
  });

  it('maps mixed-content text diffs to their #text line', () => {
    const { baseText, lineMap } = aligned(
      '<a><b>1</b>hello</a>',
      '<a><b>1</b>world</a>',
    );

    // #text renders as its own line right after the open tag.
    expect(baseText).toBe('<a>\n  hello\n  <b>1</b>\n</a>');
    expect(lineMap.get('a.#text')).toBe(2);
  });

  it('returns identical texts and an empty line map when there are no differences', () => {
    const xml = '<r><a><b>x</b></a><item>1</item><item>2</item></r>';
    const { baseText, contrastText, lineMap } = aligned(xml, xml);

    expect(baseText).toBe(contrastText);
    expect(lineMap.size).toBe(0);
  });
});
