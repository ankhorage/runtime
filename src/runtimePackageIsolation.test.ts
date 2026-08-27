import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'bun:test';

interface RuntimePackageManifest {
  readonly dependencies?: Readonly<Record<string, string>>;
  readonly devDependencies?: Readonly<Record<string, string>>;
  readonly peerDependencies?: Readonly<Record<string, string>>;
  readonly peerDependenciesMeta?: Readonly<Record<string, { readonly optional?: boolean }>>;
}

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

function readRuntimePackageManifest(): RuntimePackageManifest {
  return JSON.parse(
    readFileSync(path.join(import.meta.dir, '..', 'package.json'), 'utf8'),
  ) as RuntimePackageManifest;
}

describe('@ankhorage/runtime package isolation', () => {
  it('does not import Expo or Expo Runtime anywhere in implementation source', () => {
    const sourceFiles = listSourceFiles(import.meta.dir);
    const expoImport =
      /(?:from\s+|import\s*\()['"](?:@expo\/|@ankhorage\/expo-runtime|expo(?:-|\/|['"]))/u;

    expect(sourceFiles.some((filePath) => expoImport.test(readFileSync(filePath, 'utf8')))).toBe(
      false,
    );
  });

  it('does not import Zora theme hooks anywhere in src', () => {
    const sourceFiles = listSourceFiles(import.meta.dir);

    expect(
      sourceFiles.some((filePath) => readFileSync(filePath, 'utf8').includes('useZoraTheme')),
    ).toBe(false);
  });

  it('does not import concrete ZORA components anywhere in src', () => {
    const sourceFiles = listSourceFiles(import.meta.dir);

    expect(
      sourceFiles.some((filePath) => readFileSync(filePath, 'utf8').includes("'@ankhorage/zora")),
    ).toBe(false);
  });

  it('does not declare Expo or Expo Runtime in any dependency section', () => {
    const packageJson = readRuntimePackageManifest();
    const packageNames = Object.keys({
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
      ...packageJson.peerDependencies,
    });

    expect(
      packageNames.filter(
        (name) =>
          name === 'expo' ||
          name.startsWith('expo-') ||
          name.startsWith('@expo/') ||
          name === '@ankhorage/expo-runtime',
      ),
    ).toEqual([]);
  });

  it('does not declare ZORA as a dependency or peer dependency', () => {
    const packageJson = readRuntimePackageManifest();

    expect(packageJson.dependencies?.['@ankhorage/zora']).toBeUndefined();
    expect(packageJson.peerDependencies?.['@ankhorage/zora']).toBeUndefined();
  });
});

describe('@ankhorage/runtime platform baseline', () => {
  it('declares the React 19.2, RN 0.86, and optional RN Web 0.21 consumer contract', () => {
    const packageJson = readRuntimePackageManifest();

    expect(packageJson.peerDependencies).toMatchObject({
      react: '19.2.3',
      'react-native': '0.86.x',
      'react-native-web': '~0.21.0',
    });
    expect(packageJson.peerDependenciesMeta?.['react-native-web']?.optional).toBe(true);
    expect(packageJson.devDependencies).toMatchObject({
      react: '19.2.3',
      'react-native': '0.86.3',
      'react-native-web': '~0.21.0',
      typescript: '~6.0.3',
    });
  });
});
