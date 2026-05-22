import { readFileSync } from 'fs';
import { join } from 'path';
import { packageDirectorySync } from 'package-directory';

let cachedVersion: string | undefined;

export function clearVersionCache(): void {
  cachedVersion = undefined;
}

export function getPkgVersion(): string {
  if (cachedVersion) {
    return cachedVersion;
  }

  const pkgDir = packageDirectorySync({ cwd: __dirname });
  if (!pkgDir) {
    throw new Error('Failed to find package directory');
  }

  const pkg = JSON.parse(
    readFileSync(join(pkgDir, 'package.json'), 'utf-8'),
  ) as {
    version: string;
  };
  cachedVersion = pkg.version;
  return pkg.version;
}
