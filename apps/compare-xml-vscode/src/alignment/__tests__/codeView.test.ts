import { describe, expect, it } from 'vitest';
import { compareXML, parseXML } from '@compare-xml/core';
import type { XMLValueDifference } from '@compare-xml/core';
import { xmlToCodeLines } from '@/alignment/codeLine';
import {
  showXMLCodeWithDifferences,
  type XMLViewLine,
} from '@/alignment/codeView';

function contents(lines: XMLViewLine[]): string[] {
  return lines.map((l) => (l.codeLine ? l.codeLine.content : ''));
}

function viewFor(
  base: string,
  contrast: string,
  differences: XMLValueDifference[],
) {
  return showXMLCodeWithDifferences({
    xmlCodeLines: xmlToCodeLines({
      xml: parseXML(base),
      anotherXML: parseXML(contrast),
    }),
    anotherXMLCodeLines: xmlToCodeLines({
      xml: parseXML(contrast),
      anotherXML: parseXML(base),
    }),
    xmlValueDifferences: differences,
  });
}

describe('showXMLCodeWithDifferences', () => {
  it('pairs a deleted region with an added region at the same position', () => {
    const base = '<root><a>1</a><b>2</b></root>';
    const contrast = '<root><a>1</a><c>3</c></root>';
    const differences: XMLValueDifference[] = [
      {
        pathSegments: ['root', 'b'],
        pathString: 'root.b',
        pathBelongsTo: 'base',
        diffType: 'deleted',
      },
      {
        pathSegments: ['root', 'c'],
        pathString: 'root.c',
        pathBelongsTo: 'contrast',
        diffType: 'added',
      },
    ];

    const [baseView, contrastView] = viewFor(base, contrast, differences);

    expect(contents(baseView)).toEqual([
      '<root>',
      '<a>1</a>',
      '<b>2</b>',
      '</root>',
    ]);
    expect(contents(contrastView)).toEqual([
      '<root>',
      '<a>1</a>',
      '<c>3</c>',
      '</root>',
    ]);
    expect(baseView[2].diffType).toBe('deleted');
    expect(contrastView[2].diffType).toBe('added');
  });

  it('pads the shorter side of a replaced region pair with unequal sizes', () => {
    const base = '<root><gone><x>1</x><y>2</y></gone></root>';
    const contrast = '<root><new>1</new></root>';
    const differences = compareXML({ baseXML: base, contrastXML: contrast });

    const [baseView, contrastView] = viewFor(base, contrast, differences);

    expect(contents(baseView)).toEqual([
      '<root>',
      '<gone>',
      '<x>1</x>',
      '<y>2</y>',
      '</gone>',
      '</root>',
    ]);
    expect(contents(contrastView)).toEqual([
      '<root>',
      '<new>1</new>',
      '',
      '',
      '',
      '</root>',
    ]);
    expect(baseView.length).toBe(contrastView.length);
    expect([1, 2, 3, 4].map((i) => baseView[i].diffType)).toEqual([
      'deleted',
      'deleted',
      'deleted',
      'deleted',
    ]);
    expect(contrastView[1].diffType).toBe('added');
    expect([2, 3, 4].map((i) => contrastView[i].blank)).toEqual([
      true,
      true,
      true,
    ]);
  });

  it('marks both sides of a value-changed line', () => {
    const base = '<root><a>1</a></root>';
    const contrast = '<root><a>2</a></root>';
    const differences: XMLValueDifference[] = [
      {
        pathSegments: ['root', 'a'],
        pathString: 'root.a',
        pathBelongsTo: 'both',
        diffType: 'valueChanged',
      },
    ];

    const [baseView, contrastView] = viewFor(base, contrast, differences);

    expect(contents(baseView)).toEqual(['<root>', '<a>1</a>', '</root>']);
    expect(contents(contrastView)).toEqual(['<root>', '<a>2</a>', '</root>']);
    expect(baseView[1].diffType).toBe('valueChanged');
    expect(contrastView[1].diffType).toBe('valueChanged');
  });

  it('pads the contrast side when an element becomes a primitive (object to text)', () => {
    const base = '<root><o><x>1</x></o></root>';
    const contrast = '<root><o>1</o></root>';
    const differences = compareXML({ baseXML: base, contrastXML: contrast });

    const [baseView, contrastView] = viewFor(base, contrast, differences);

    expect(contents(baseView)).toEqual([
      '<root>',
      '<o>',
      '<x>1</x>',
      '</o>',
      '</root>',
    ]);
    expect(contents(contrastView)).toEqual([
      '<root>',
      '<o>1</o>',
      '',
      '',
      '</root>',
    ]);
    expect(baseView.length).toBe(contrastView.length);
    expect([1, 2, 3].map((i) => baseView[i].diffType)).toEqual([
      'valueChanged',
      'valueChanged',
      'valueChanged',
    ]);
    expect(contrastView[1].diffType).toBe('valueChanged');
    expect([2, 3].map((i) => contrastView[i].blank)).toEqual([true, true]);
  });

  it('aligns value-changed regions whose element names differ only by case (keyCaseInsensitive)', () => {
    const base = '<root><Name>1</Name></root>';
    const contrast = '<root><name><x>1</x><y>2</y></name></root>';
    const differences = compareXML({
      baseXML: base,
      contrastXML: contrast,
      options: { keyCaseInsensitive: true },
    });

    const [baseView, contrastView] = viewFor(base, contrast, differences);

    expect(contents(baseView)).toEqual([
      '<root>',
      '<Name>1</Name>',
      '',
      '',
      '',
      '</root>',
    ]);
    expect(contents(contrastView)).toEqual([
      '<root>',
      '<name>',
      '<x>1</x>',
      '<y>2</y>',
      '</name>',
      '</root>',
    ]);
    expect(baseView.length).toBe(contrastView.length);
    expect(baseView[1].diffType).toBe('valueChanged');
    expect([2, 3, 4].map((i) => baseView[i].blank)).toEqual([true, true, true]);
    expect([1, 2, 3, 4].map((i) => contrastView[i].diffType)).toEqual([
      'valueChanged',
      'valueChanged',
      'valueChanged',
      'valueChanged',
    ]);
  });

  it('aligns a multi-line deleted region with blank lines on the contrast side', () => {
    const base = '<root><a>1</a><gone><x>1</x><y>2</y></gone></root>';
    const contrast = '<root><a>1</a></root>';
    const differences: XMLValueDifference[] = [
      {
        pathSegments: ['root', 'gone'],
        pathString: 'root.gone',
        pathBelongsTo: 'base',
        diffType: 'deleted',
      },
    ];

    const [baseView, contrastView] = viewFor(base, contrast, differences);

    expect(contents(baseView)).toEqual([
      '<root>',
      '<a>1</a>',
      '<gone>',
      '<x>1</x>',
      '<y>2</y>',
      '</gone>',
      '</root>',
    ]);
    expect(contents(contrastView)).toEqual([
      '<root>',
      '<a>1</a>',
      '',
      '',
      '',
      '',
      '</root>',
    ]);
    expect(baseView.length).toBe(contrastView.length);
    expect([2, 5].map((i) => baseView[i].diffType)).toEqual([
      'deleted',
      'deleted',
    ]);
    expect([2, 3, 4, 5].map((i) => contrastView[i].blank)).toEqual([
      true,
      true,
      true,
      true,
    ]);
  });
});
