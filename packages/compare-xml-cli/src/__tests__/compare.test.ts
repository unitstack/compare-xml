import { describe, it, expect, afterEach, vi, beforeAll } from 'vitest';
import { unlinkSync, readFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import type { XMLValueDifference } from '@compare-xml/core';
import { compare, formatTable } from '../compare';

beforeAll(() => {
  mkdirSync(join(__dirname, 'temp'), { recursive: true });
});

describe('compare', () => {
  const outputFile = join(__dirname, 'temp', 'output.txt');

  afterEach(() => {
    try {
      unlinkSync(outputFile);
    } catch {
      //
    }
    vi.restoreAllMocks();
  });

  it('should output table format to console', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    compare('<root><a>1</a></root>', '<root><b>2</b></root>');
    expect(consoleSpy).toHaveBeenCalledWith(EXPECTED_TABLE_OUTPUT);
    consoleSpy.mockRestore();
  });

  it('should output JSON format', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    compare('<root><a>1</a></root>', '<root><a>2</a></root>', {
      jsonExport: true,
    });
    const output = consoleSpy.mock.calls[0][0] as string;
    const parsed = JSON.parse(output) as XMLValueDifference[];
    expect(parsed).toEqual([
      {
        pathSegments: ['root', 'a'],
        pathString: 'root.a',
        pathBelongsTo: 'both',
        diffType: 'valueChanged',
      },
    ]);
    consoleSpy.mockRestore();
  });

  it('should write to output file', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    compare('<root><a>1</a></root>', '<root><b>2</b></root>', {
      output: outputFile,
    });
    expect(readFileSync(outputFile, 'utf-8')).toEqual(EXPECTED_TABLE_OUTPUT);
    consoleSpy.mockRestore();
  });

  it('should use compare options', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    compare(
      '<root><arr><item>1</item><item>2</item></arr></root>',
      '<root><arr><item>2</item><item>1</item></arr></root>',
      {
        arrayCompareMethod: 'unordered',
        keyCaseInsensitive: true,
      },
    );
    expect(consoleSpy).toHaveBeenCalledWith('No differences found');
    consoleSpy.mockRestore();
  });

  it('should show (Contrast) prefix for added keys in table output', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    compare('<root><a>1</a></root>', '<root><a>1</a><b>2</b></root>');
    const output = consoleSpy.mock.calls[0][0] as string;
    expect(output).toContain('(Contrast) root.b');
    expect(output).toContain('added');
    consoleSpy.mockRestore();
  });

  it('should show (Base) prefix for deleted keys in table output', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    compare('<root><a>1</a><b>2</b></root>', '<root><a>1</a></root>');
    const output = consoleSpy.mock.calls[0][0] as string;
    expect(output).toContain('(Base) root.b');
    expect(output).toContain('deleted');
    consoleSpy.mockRestore();
  });

  it('should use key and value case insensitive options', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    compare(
      '<root><Name>alice</Name></root>',
      '<root><name>ALICE</name></root>',
      {
        keyCaseInsensitive: true,
        valueCaseInsensitive: true,
      },
    );
    expect(consoleSpy).toHaveBeenCalledWith('No differences found');
    consoleSpy.mockRestore();
  });

  it('should print error and exit for invalid base XML', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const exitSpy = vi
      .spyOn(process, 'exit')
      .mockImplementation(() => undefined as never);

    compare('<unclosed', '<root><a>1</a></root>');

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringMatching(/Error: .*Failed to parse base input/),
    );
    expect(exitSpy).toHaveBeenCalledWith(1);

    consoleSpy.mockRestore();
    exitSpy.mockRestore();
  });

  it('should print error and exit for invalid contrast XML', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const exitSpy = vi
      .spyOn(process, 'exit')
      .mockImplementation(() => undefined as never);

    compare('<root><a>1</a></root>', '<unclosed');

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringMatching(/Error: .*Failed to parse contrast input/),
    );
    expect(exitSpy).toHaveBeenCalledWith(1);

    consoleSpy.mockRestore();
    exitSpy.mockRestore();
  });

  it('should print error and exit for XML parse error during comparison', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const exitSpy = vi
      .spyOn(process, 'exit')
      .mockImplementation(() => undefined as never);

    compare('<root><unclosed', '<root/>');

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringMatching(/Error:/));
    expect(exitSpy).toHaveBeenCalledWith(1);

    consoleSpy.mockRestore();
    exitSpy.mockRestore();
  });
});

describe('formatTable', () => {
  it('should format empty differences', () => {
    const result = formatTable([]);
    expect(result).toBe('No differences found');
  });

  it('should format differences as table with borders', () => {
    const diffs: XMLValueDifference[] = [
      {
        pathSegments: ['root', 'a'],
        pathString: 'root.a',
        pathBelongsTo: 'base',
        diffType: 'deleted',
      },
      {
        pathSegments: ['root', 'b'],
        pathString: 'root.b',
        pathBelongsTo: 'contrast',
        diffType: 'added',
      },
    ];
    const result = formatTable(diffs);
    expect(result).toBe(EXPECTED_TABLE_OUTPUT);
  });

  it('should prefix added keys with (Contrast)', () => {
    const diffs: XMLValueDifference[] = [
      {
        pathSegments: ['root', 'newKey'],
        pathString: 'root.newKey',
        pathBelongsTo: 'contrast',
        diffType: 'added',
      },
    ];
    const result = formatTable(diffs);
    expect(result).toContain('(Contrast) root.newKey');
  });

  it('should prefix deleted/valueChanged keys with (Base)', () => {
    const diffs: XMLValueDifference[] = [
      {
        pathSegments: ['root', 'oldKey'],
        pathString: 'root.oldKey',
        pathBelongsTo: 'base',
        diffType: 'deleted',
      },
      {
        pathSegments: ['root', 'changed'],
        pathString: 'root.changed',
        pathBelongsTo: 'both',
        diffType: 'valueChanged',
      },
    ];
    const result = formatTable(diffs);
    expect(result).toContain('(Base) root.oldKey');
    expect(result).toContain('(Base) root.changed');
  });

  it('should use root label for empty path segments', () => {
    const diffs: XMLValueDifference[] = [
      {
        pathSegments: [],
        pathString: '',
        pathBelongsTo: 'both',
        diffType: 'valueChanged',
      },
    ];
    const result = formatTable(diffs);
    expect(result).toBe(EXPECTED_TABLE_WITH_ROOT);
  });

  it('should handle many differences', () => {
    const diffs: XMLValueDifference[] = Array.from({ length: 10 }, (_, i) => ({
      pathSegments: ['root', `key${i}`],
      pathString: `root.key${i}`,
      pathBelongsTo: i % 2 === 0 ? 'base' : 'contrast',
      diffType: i % 2 === 0 ? 'deleted' : 'added',
    }));
    const result = formatTable(diffs);
    expect(result.split('\n').length).toBe(14); // borders + header + separator + 10 rows
  });

  it('should handle long path strings', () => {
    const longPath = 'a'.repeat(50);
    const diffs: XMLValueDifference[] = [
      {
        pathSegments: ['root', longPath],
        pathString: `root.${longPath}`,
        pathBelongsTo: 'both',
        diffType: 'valueChanged',
      },
    ];
    const result = formatTable(diffs);
    expect(result).toContain(`(Base) root.${longPath}`);
  });
});

const EXPECTED_TABLE_OUTPUT = `
┌───────────────────┬─────────────┐
│ Key               │ Change Type │
├───────────────────┼─────────────┤
│ (Base) root.a     │ deleted     │
│ (Contrast) root.b │ added       │
└───────────────────┴─────────────┘
`.trim();

const EXPECTED_TABLE_WITH_ROOT = `
┌────────┬──────────────┐
│ Key    │ Change Type  │
├────────┼──────────────┤
│ (Root) │ valueChanged │
└────────┴──────────────┘
`.trim();
