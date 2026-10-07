import { readFile } from 'node:fs/promises';

import { expect, test } from 'bun:test';

import {
  createRuntimeApiOperationExecutor,
  createRuntimeBindingOperationKey,
  resolveRuntimeBindingValue,
  validateRuntimeBindingOperationRef,
} from './bindings';

test('headless bindings entrypoint exposes canonical Runtime API helpers', () => {
  expect(typeof createRuntimeApiOperationExecutor).toBe('function');
  expect(typeof createRuntimeBindingOperationKey).toBe('function');
  expect(typeof resolveRuntimeBindingValue).toBe('function');
  expect(typeof validateRuntimeBindingOperationRef).toBe('function');
});

test('package exports headless bindings without renderer modules', async () => {
  const packageJson = JSON.parse(await readFile('package.json', 'utf8')) as {
    readonly exports?: Readonly<Record<string, unknown>>;
  };
  const source = await readFile('src/bindings.ts', 'utf8');

  expect(packageJson.exports?.['./bindings']).toEqual({
    types: './dist/bindings.d.ts',
    import: './dist/bindings.js',
  });
  expect(source).not.toContain('RuntimeRenderer');
  expect(source).not.toContain('RuntimeScreen');
  expect(source).not.toContain('react-native');
  expect(source).not.toContain("from 'react'");
});

test('marks the renderer root as a browser and React Native export', async () => {
  const packageJson = JSON.parse(await readFile('package.json', 'utf8')) as {
    readonly exports?: Readonly<Record<string, unknown>>;
  };

  expect(packageJson.exports?.['.']).toEqual({
    'react-native': './dist/index.js',
    browser: './dist/index.js',
    types: './dist/index.d.ts',
    import: './dist/index.js',
  });
  expect(packageJson.exports?.['./bindings']).toEqual({
    types: './dist/bindings.d.ts',
    import: './dist/bindings.js',
  });
  expect(packageJson.exports?.['./capabilities']).toEqual({
    types: './dist/capabilities/index.d.ts',
    import: './dist/capabilities/index.js',
  });
});
