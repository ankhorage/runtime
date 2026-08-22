import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { describe, expect, it } from 'bun:test';

interface ReactNativeWebFixtureModule {
  readonly renderReactNativeWebRuntimeFixture: () => string;
}

function isFixtureModule(value: unknown): value is ReactNativeWebFixtureModule {
  if (typeof value !== 'object' || value === null) return false;
  return typeof Reflect.get(value, 'renderReactNativeWebRuntimeFixture') === 'function';
}

const reactNativeWebAlias: Bun.BunPlugin = {
  name: 'runtime-react-native-web-0.21',
  setup(builder) {
    builder.onResolve({ filter: /^react-native$/u }, () => ({
      path: fileURLToPath(import.meta.resolve('react-native-web')),
    }));
  },
};

async function loadBundledFixture(): Promise<ReactNativeWebFixtureModule> {
  const result = await Bun.build({
    entrypoints: ['./tests/reactNativeWebCompatibility.fixture.tsx'],
    target: 'bun',
    format: 'esm',
    define: {
      __DEV__: 'false',
      'process.env.NODE_ENV': '"production"',
    },
    plugins: [reactNativeWebAlias],
  });
  expect(result.logs).toEqual([]);
  expect(result.success).toBe(true);

  const [artifact] = result.outputs;
  if (!artifact) throw new Error('React Native Web compatibility bundle produced no output');
  const source = await artifact.text();
  const fixtureDirectory = await mkdtemp(path.join(tmpdir(), 'ankhorage-runtime-rnw-'));
  const fixturePath = path.join(fixtureDirectory, 'fixture.mjs');

  try {
    await writeFile(fixturePath, source, 'utf8');
    const fixtureModule: unknown = await import(pathToFileURL(fixturePath).href);
    if (!isFixtureModule(fixtureModule)) throw new Error('Invalid Web compatibility fixture');
    return fixtureModule;
  } finally {
    await rm(fixtureDirectory, { force: true, recursive: true });
  }
}

describe('React Native Web 0.21 compatibility', () => {
  it('bundles the native entry through RN Web and renders the injected registry', async () => {
    const fixture = await loadBundledFixture();
    const markup = fixture.renderReactNativeWebRuntimeFixture();

    expect(markup).toContain('aria-label="Runtime Web root"');
    expect(markup).toContain('data-testid="web-root"');
    expect(markup).toContain('data-testid="web-label"');
    expect(markup).toContain('React Native Web 0.21');
  });
});
