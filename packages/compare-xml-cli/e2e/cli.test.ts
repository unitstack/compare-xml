import { describe, it, expect, beforeEach, afterEach, beforeAll } from 'vitest';
import { execSync } from 'child_process';
import { writeFileSync, unlinkSync, readFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import type { XMLValueDifference } from '@compare-xml/core';

const CLI_PATH = join(__dirname, '../dist/cli.js');

beforeAll(() => {
  mkdirSync(join(__dirname, 'temp'), { recursive: true });
});

describe('CLI e2e', () => {
  const testFile1 = join(__dirname, 'temp', 'test1.xml');
  const testFile2 = join(__dirname, 'temp', 'test2.xml');
  const outputFile = join(__dirname, 'temp', 'output.json');

  beforeEach(() => {
    writeFileSync(testFile1, '<root><a>1</a><b>2</b></root>');
    writeFileSync(testFile2, '<root><a>2</a><c>3</c></root>');
  });

  afterEach(() => {
    [testFile1, testFile2, outputFile].forEach((f) => {
      try {
        unlinkSync(f);
      } catch {
        //
      }
    });
  });

  it('should show help when no arguments provided', () => {
    const result = execSync(`node ${CLI_PATH}`, {
      encoding: 'utf-8',
    });
    expect(result).toContain('Usage:');
    expect(result).toContain('compare-xml');
  });

  it('should show version with --version', () => {
    const result = execSync(`node ${CLI_PATH} --version`, {
      encoding: 'utf-8',
    });
    expect(result.trim()).toMatch(/^\d+\.\d+\.\d+/);
  });

  it('should error on invalid XML string', () => {
    expect(() =>
      execSync(`node ${CLI_PATH} '<invalid>' '<root>1</root>'`, {
        encoding: 'utf-8',
      }),
    ).toThrow();
  });

  it('should error on non-existent file path', () => {
    expect(() =>
      execSync(`node ${CLI_PATH} /nonexistent/file.xml '<root>1</root>'`, {
        encoding: 'utf-8',
      }),
    ).toThrow();
  });

  it('should compare XML strings', () => {
    const result = execSync(
      `node ${CLI_PATH} '<root><a>1</a></root>' '<root><a>2</a></root>'`,
      {
        encoding: 'utf-8',
      },
    );
    expect(result.trim()).toBe(EXPECTED_SINGLE_VALUE_CHANGED);
  });

  it('should compare XML files', () => {
    const result = execSync(`node ${CLI_PATH} ${testFile1} ${testFile2}`, {
      encoding: 'utf-8',
    });
    expect(result.trim()).toBe(EXPECTED_MULTIPLE_CHANGES);
  });

  it('should output JSON format', () => {
    const result = execSync(
      `node ${CLI_PATH} '<root><a>1</a></root>' '<root><a>2</a></root>' --json-export`,
      { encoding: 'utf-8' },
    );
    const parsed = JSON.parse(result) as XMLValueDifference[];
    expect(parsed).toEqual([
      {
        pathSegments: ['root', 'a'],
        pathString: 'root.a',
        pathBelongsTo: 'both',
        diffType: 'valueChanged',
      },
    ]);
  });

  it('should write to output file', () => {
    execSync(`node ${CLI_PATH} ${testFile1} ${testFile2} -o ${outputFile}`, {
      encoding: 'utf-8',
    });
    const content = readFileSync(outputFile, 'utf-8');
    expect(content).toBe(EXPECTED_MULTIPLE_CHANGES);
  });

  it('should write JSON format to output file', () => {
    execSync(`node ${CLI_PATH} ${testFile1} ${testFile2} -j -o ${outputFile}`, {
      encoding: 'utf-8',
    });
    const content = readFileSync(outputFile, 'utf-8');
    const parsed = JSON.parse(content) as XMLValueDifference[];
    expect(parsed).toEqual([
      {
        pathSegments: ['root', 'a'],
        pathString: 'root.a',
        pathBelongsTo: 'both',
        diffType: 'valueChanged',
      },
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
    ]);
  });

  it('should use array compare method', () => {
    const result = execSync(
      `node ${CLI_PATH} '<root><arr><item>1</item><item>2</item></arr></root>' '<root><arr><item>2</item><item>1</item></arr></root>' -a unordered`,
      { encoding: 'utf-8' },
    );
    expect(result).toContain('No differences found');
  });

  it('should use key case insensitive option', () => {
    const result = execSync(
      `node ${CLI_PATH} '<root><Name>Alice</Name></root>' '<root><name>Alice</name></root>' -k`,
      { encoding: 'utf-8' },
    );
    expect(result).toContain('No differences found');
  });

  it('should use value case insensitive option', () => {
    const result = execSync(
      `node ${CLI_PATH} '<root><status>OK</status></root>' '<root><status>ok</status></root>' -v`,
      { encoding: 'utf-8' },
    );
    expect(result).toContain('No differences found');
  });

  it('should handle simple value differences', () => {
    const result = execSync(
      `node ${CLI_PATH} '<root>1</root>' '<root>hello</root>'`,
      {
        encoding: 'utf-8',
      },
    );
    expect(result.trim()).toBe(EXPECTED_VALUE_DIFF);
  });
});

const EXPECTED_VALUE_DIFF = `
┌─────────────┬──────────────┐
│ Key         │ Change Type  │
├─────────────┼──────────────┤
│ (Base) root │ valueChanged │
└─────────────┴──────────────┘
`.trim();

const EXPECTED_SINGLE_VALUE_CHANGED = `
┌───────────────┬──────────────┐
│ Key           │ Change Type  │
├───────────────┼──────────────┤
│ (Base) root.a │ valueChanged │
└───────────────┴──────────────┘
`.trim();

const EXPECTED_MULTIPLE_CHANGES = `
┌───────────────────┬──────────────┐
│ Key               │ Change Type  │
├───────────────────┼──────────────┤
│ (Base) root.a     │ valueChanged │
│ (Base) root.b     │ deleted      │
│ (Contrast) root.c │ added        │
└───────────────────┴──────────────┘
`.trim();
