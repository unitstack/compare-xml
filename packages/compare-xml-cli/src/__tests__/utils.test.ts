import {
  describe,
  it,
  expect,
  afterEach,
  beforeAll,
  beforeEach,
  vi,
} from 'vitest';
import { writeFileSync, unlinkSync, mkdirSync } from 'fs';
import { join } from 'path';
import { packageDirectorySync } from 'package-directory';
import { getPkgVersion, parseInput } from '../utils';
import { clearVersionCache } from '../pkg';
import { version as pkgVersion } from '../../package.json';

vi.mock('package-directory', () => ({
  packageDirectorySync: vi.fn(),
}));

beforeAll(() => {
  mkdirSync(join(__dirname, 'temp'), { recursive: true });
});

describe('getPkgVersion', () => {
  beforeEach(() => {
    clearVersionCache();
    vi.mocked(packageDirectorySync).mockReturnValue(join(__dirname, '../..'));
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

  it('should cache the version after first call', () => {
    clearVersionCache();
    vi.mocked(packageDirectorySync).mockReturnValue(join(__dirname, '../..'));
    const v1 = getPkgVersion();
    const v2 = getPkgVersion();
    expect(v1).toEqual(v2);
    expect(packageDirectorySync).toHaveBeenCalledTimes(1);
  });
});

describe('parseInput', () => {
  const testFile = join(__dirname, 'temp', 'test.xml');

  afterEach(() => {
    try {
      unlinkSync(testFile);
    } catch {
      //
    }
  });

  it('should parse XML string', () => {
    const result = parseInput('<root><a>1</a></root>', 'base');
    expect(result).toEqual('<root><a>1</a></root>');
  });

  it('should parse XML file', () => {
    writeFileSync(testFile, '<root><b>2</b></root>');
    const result = parseInput(testFile, 'contrast');
    expect(result).toEqual('<root><b>2</b></root>');
  });

  it('should throw error for invalid XML string from argument', () => {
    expect(() => parseInput('<invalid>', 'base')).toThrow(
      /Failed to parse base input: if you passed a file path, the file was not found; if you passed an XML string, it failed to parse\. Error: .+/,
    );
  });

  it('should throw error for invalid XML string with line info', () => {
    expect(() => parseInput('<unclosed', 'base')).toThrow(/line/);
  });

  it('should throw error for invalid XML file path', () => {
    const testFile = join(__dirname, 'temp', 'unknown.xml');
    expect(() => parseInput(testFile, 'contrast')).toThrow(
      /Failed to parse contrast input: if you passed a file path, the file was not found; if you passed an XML string, it failed to parse\. Error: .+/,
    );
  });

  it('should throw error for invalid XML file content', () => {
    const testFile = join(__dirname, 'temp', 'invalid.xml');
    writeFileSync(testFile, 'not valid xml');
    expect(() => parseInput(testFile, 'contrast')).toThrow(
      new RegExp(
        `Failed to parse contrast file content from ${testFile.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}, unable to parse as XML. Error: .+`,
      ),
    );
    unlinkSync(testFile);
  });

  it('should throw error for empty XML string', () => {
    expect(() => parseInput('', 'base')).toThrow(/XML is empty/);
  });
});
