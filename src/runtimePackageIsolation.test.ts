import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'bun:test';

function listSourceFiles(directoryPath: string): string[] {
  return readdirSync(directoryPath, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directoryPath, entry.name);
    if (entry.isDirectory()) {
      return listSourceFiles(entryPath);
    }

    if (!entry.name.endsWith('.ts') && !entry.name.endsWith('.tsx')) {
      return [];
    }

    return entry.name.includes('.test.') ? [] : [entryPath];
  });
}

describe('@ankhorage/runtime package isolation', () => {
  it('does not import expo-router anywhere in src', () => {
    const sourceFiles = listSourceFiles(import.meta.dir);

    expect(
      sourceFiles.some((filePath) => readFileSync(filePath, 'utf8').includes("'expo-router'")),
    ).toBe(false);
  });

  it('does not import Zora theme hooks anywhere in src', () => {
    const sourceFiles = listSourceFiles(import.meta.dir);

    expect(
      sourceFiles.some((filePath) => readFileSync(filePath, 'utf8').includes('useZoraTheme')),
    ).toBe(false);
  });

  it('does not declare expo-router as a dependency or peer dependency', () => {
    const packageJson = JSON.parse(
      readFileSync(path.join(import.meta.dir, '..', 'package.json'), 'utf8'),
    ) as {
      dependencies?: Record<string, string>;
      peerDependencies?: Record<string, string>;
    };

    expect(packageJson.dependencies?.['expo-router']).toBeUndefined();
    expect(packageJson.peerDependencies?.['expo-router']).toBeUndefined();
  });
});
