import { describe, expect, it } from 'vitest';
import { computeSession } from '@/core/compareSession';

const defaults = {
  arrayCompareMethod: 'byIndex',
  keyCaseInsensitive: false,
  valueCaseInsensitive: false,
} as const;

describe('computeSession', () => {
  it('returns differences and aligned texts for valid XML inputs', () => {
    const session = computeSession(
      { label: 'a.xml', text: '<r><x>1</x></r>' },
      { label: 'b.xml', text: '<r><x>2</x></r>' },
      { ...defaults },
    );

    expect(session.differences).toEqual([
      {
        pathSegments: ['r', 'x'],
        pathString: 'r.x',
        pathBelongsTo: 'both',
        diffType: 'valueChanged',
      },
    ]);
    expect(session.baseAlignedText).toBe('<r>\n  <x>1</x>\n</r>');
    expect(session.contrastAlignedText).toBe('<r>\n  <x>2</x>\n</r>');
    expect(session.lineMap.get('r.x')).toBe(2);
  });

  it('passes comparison options through to compareXML', () => {
    const session = computeSession(
      { label: 'a.xml', text: '<r><Name>ALICE</Name></r>' },
      { label: 'b.xml', text: '<r><name>alice</name></r>' },
      { ...defaults, keyCaseInsensitive: true, valueCaseInsensitive: true },
    );

    expect(session.differences).toEqual([]);
  });

  it('throws a labeled error with location for invalid base XML', () => {
    expect(() =>
      computeSession(
        { label: 'base.xml', text: '<r><x></r>' },
        { label: 'b.xml', text: '<r/>' },
        { ...defaults },
      ),
    ).toThrow(/Invalid XML in base\.xml at line \d+/);
  });

  it('throws a labeled error for invalid contrast XML', () => {
    expect(() =>
      computeSession(
        { label: 'a.xml', text: '<r/>' },
        { label: 'contrast.xml', text: '<r><x></r>' },
        { ...defaults },
      ),
    ).toThrow(/Invalid XML in contrast\.xml/);
  });

  it('throws a labeled error for empty input', () => {
    expect(() =>
      computeSession(
        { label: 'a.xml', text: '<r/>' },
        { label: 'contrast.xml', text: '   ' },
        { ...defaults },
      ),
    ).toThrow(/Invalid XML in contrast\.xml: XML is empty/);
  });
});
