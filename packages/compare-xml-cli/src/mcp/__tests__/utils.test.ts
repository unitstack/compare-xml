import { writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
  vi,
} from 'vitest';
import { packageDirectorySync } from 'package-directory';
import { getPkgVersion, parseInput } from '../utils';
import { clearVersionCache } from '../../pkg';
import { version as pkgVersion } from '../../../package.json';

vi.mock('package-directory', () => ({
  packageDirectorySync: vi.fn(),
}));

describe('getPkgVersion', () => {
  beforeEach(() => {
    clearVersionCache();
    vi.mocked(packageDirectorySync).mockReturnValue(
      join(__dirname, '../../..'),
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return the package version', () => {
    const version = getPkgVersion();
    expect(version).toEqual(pkgVersion);
  });

  it('should throw error when package directory not found', () => {
    clearVersionCache();
    vi.mocked(packageDirectorySync).mockReturnValue(undefined);
    expect(() => getPkgVersion()).toThrow('Failed to find package directory');
  });
});

describe('parseInput', () => {
  const testFile = join(__dirname, 'test.xml');

  beforeAll(() => {
    writeFileSync(testFile, '<root><test>data</test></root>');
  });

  afterAll(() => {
    unlinkSync(testFile);
  });

  it('should throw error when no input provided', () => {
    expect(() => parseInput(undefined, undefined, undefined, 'base')).toThrow(
      'No base value provided. Please set one of: baseXML, baseXMLString, or baseXMLFilePath',
    );
  });

  it('should parse XML from file path', () => {
    const result = parseInput(undefined, undefined, testFile, 'base');
    expect(result).toEqual('<root><test>data</test></root>');
  });

  it('should throw error for non-existent file', () => {
    expect(() =>
      parseInput(undefined, undefined, '/nonexistent/file.xml', 'base'),
    ).toThrow('base file not found: /nonexistent/file.xml');
  });

  it('should throw error for invalid XML file content', () => {
    const invalidFile = join(__dirname, 'invalid.xml');
    writeFileSync(invalidFile, 'invalid xml');
    expect(() =>
      parseInput(undefined, undefined, invalidFile, 'contrast'),
    ).toThrow(/Failed to parse contrast file content from .+\. Error: .+/);
    unlinkSync(invalidFile);
  });

  it('should throw error for invalid XML file content with line info', () => {
    const invalidFile = join(__dirname, 'invalid2.xml');
    writeFileSync(invalidFile, '<unclosed');
    expect(() =>
      parseInput(undefined, undefined, invalidFile, 'contrast'),
    ).toThrow(/line/);
    unlinkSync(invalidFile);
  });

  it('should parse XML from string', () => {
    const result = parseInput(
      undefined,
      '<root><key>value</key></root>',
      undefined,
      'base',
    );
    expect(result).toEqual('<root><key>value</key></root>');
  });

  it('should throw error for invalid XML string', () => {
    expect(() => parseInput(undefined, '<invalid>', undefined, 'base')).toThrow(
      /Failed to parse base XML string\. Error: .+/,
    );
  });

  it('should throw error for invalid XML string with line info', () => {
    expect(() => parseInput(undefined, '<unclosed', undefined, 'base')).toThrow(
      /line/,
    );
  });

  it('should return XML string directly', () => {
    const input = '<root><direct>object</direct></root>';
    const result = parseInput(input, undefined, undefined, 'base');
    expect(result).toEqual(input);
  });

  it('should prioritize file path over string and XML', () => {
    const result = parseInput(
      '<root><a>1</a></root>',
      '<root><b>2</b></root>',
      testFile,
      'base',
    );
    expect(result).toEqual('<root><test>data</test></root>');
  });

  it('should prioritize string over XML', () => {
    const result = parseInput(
      '<root><a>1</a></root>',
      '<root><b>2</b></root>',
      undefined,
      'base',
    );
    expect(result).toEqual('<root><b>2</b></root>');
  });
});
