import { describe, expect, it } from 'vitest';

import { xmlToCodeLines } from '@/alignment/codeLine';

function shape(lines: ReturnType<typeof xmlToCodeLines>) {
  return lines.map((l) => [
    l.pathString,
    l.depth,
    l.startLineNumber,
    l.endLineNumber,
    l.content,
  ]);
}

describe('xmlToCodeLines', () => {
  it('flattens nested elements, attributes, and repeated elements into line-numbered code lines', () => {
    const lines = xmlToCodeLines({
      xml: { root: { '@id': 1, name: 'Alice', item: [1, 2] } },
      anotherXML: {},
    });

    expect(shape(lines)).toEqual([
      ['root', 0, 1, 5, '<root id="1">'],
      ['root.name', 1, 2, 2, '<name>Alice</name>'],
      ['root.item[0]', 1, 3, 3, '<item>1</item>'],
      ['root.item[1]', 1, 4, 4, '<item>2</item>'],
      ['root', 0, 5, 5, '</root>'],
    ]);
  });

  it('keeps child elements in document order (no alphabetical sorting)', () => {
    const lines = xmlToCodeLines({
      xml: { r: { z: 1, a: 2 } },
      anotherXML: {},
    });

    expect(lines.map((l) => l.content)).toEqual([
      '<r>',
      '<z>1</z>',
      '<a>2</a>',
      '</r>',
    ]);
  });

  it('renders mixed text content as a #text line before child elements', () => {
    const lines = xmlToCodeLines({
      xml: { a: { '#text': 'hello', b: 'x' } },
      anotherXML: {},
    });

    expect(shape(lines)).toEqual([
      ['a', 0, 1, 4, '<a>'],
      ['a.#text', 1, 2, 2, 'hello'],
      ['a.b', 1, 3, 3, '<b>x</b>'],
      ['a', 0, 4, 4, '</a>'],
    ]);
  });

  it('renders an attribute-only element on one line when the other side is not multi-line', () => {
    const lines = xmlToCodeLines({
      xml: { a: { '@id': 1 } },
      anotherXML: { a: 'text' },
    });

    expect(shape(lines)).toEqual([['a', 0, 1, 1, '<a id="1"></a>']]);
  });

  it('splits open/close tags when the other side renders the element multi-line', () => {
    const lines = xmlToCodeLines({
      xml: { a: { '@id': 1 } },
      anotherXML: { a: { b: 1 } },
    });

    expect(shape(lines)).toEqual([
      ['a', 0, 1, 2, '<a id="1">'],
      ['a', 0, 2, 2, '</a>'],
    ]);
  });

  it('escapes text and attribute values', () => {
    const lines = xmlToCodeLines({
      xml: { a: { '@q': 'say "hi"', '#text': '1 < 2 & 3' } },
      anotherXML: {},
    });

    expect(lines[0].content).toBe(
      '<a q="say &quot;hi&quot;">1 &lt; 2 &amp; 3</a>',
    );
  });

  it('renders an empty element as an empty tag pair', () => {
    const lines = xmlToCodeLines({
      xml: { a: '' },
      anotherXML: { a: '' },
    });

    expect(shape(lines)).toEqual([['a', 0, 1, 1, '<a></a>']]);
  });
});
