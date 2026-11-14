import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { expect, test } from 'bun:test';

interface RuntimePackageManifest {
  readonly devDependencies?: Readonly<Record<string, string>>;
}

interface RuntimeBrowserConsumerDependencies {
  readonly react: string;
  readonly 'react-native': string;
  readonly 'react-native-web': string;
}

const repositoryDirectory = path.join(import.meta.dir, '..');

async function runBun(args: readonly string[], cwd: string): Promise<void> {
  const subprocess = Bun.spawn([process.execPath, ...args], {
    cwd,
    stderr: 'pipe',
    stdout: 'pipe',
  });
  const [exitCode, stderr, stdout] = await Promise.all([
    subprocess.exited,
    new Response(subprocess.stderr).text(),
    new Response(subprocess.stdout).text(),
  ]);

  if (exitCode !== 0) {
    throw new Error(`bun ${args.join(' ')} failed:\n${stdout}${stderr}`);
  }
}

function getRuntimeBrowserConsumerDependencies(
  packageManifest: RuntimePackageManifest,
): RuntimeBrowserConsumerDependencies {
  const reactVersion = packageManifest.devDependencies?.react;
  const reactNativeVersion = packageManifest.devDependencies?.['react-native'];
  const reactNativeWebVersion = packageManifest.devDependencies?.['react-native-web'];

  if (!reactVersion || !reactNativeVersion || !reactNativeWebVersion) {
    throw new Error('Runtime browser consumer requires React, React Native, and React Native Web.');
  }

  return {
    react: reactVersion,
    'react-native': reactNativeVersion,
    'react-native-web': reactNativeWebVersion,
  };
}

async function writeBrowserConsumerFiles(
  consumerDirectory: string,
  packageArchivePath: string,
  dependencies: RuntimeBrowserConsumerDependencies,
): Promise<void> {
  await mkdir(consumerDirectory);
  await writeFile(
    path.join(consumerDirectory, 'package.json'),
    `${JSON.stringify(
      {
        name: 'runtime-browser-consumer',
        private: true,
        dependencies: {
          '@ankhorage/runtime': `file:${packageArchivePath}`,
          ...dependencies,
        },
      },
      null,
      2,
    )}\n`,
    'utf8',
  );
  await writeFile(
    path.join(consumerDirectory, 'runtime-entry.ts'),
    "export { ManifestContext } from '@ankhorage/runtime';\n",
    'utf8',
  );
  await writeFile(
    path.join(consumerDirectory, 'bunfig.toml'),
    '[resolve]\nalias = { "react-native" = "react-native-web" }\n',
    'utf8',
  );
}

async function createPackedConsumerDirectory(): Promise<{
  readonly consumerDirectory: string;
  readonly fixtureDirectory: string;
}> {
  const fixtureDirectory = await mkdtemp(path.join(tmpdir(), 'ankhorage-runtime-browser-package-'));
  try {
    const consumerDirectory = path.join(fixtureDirectory, 'consumer');
    const packageManifest = JSON.parse(
      await readFile(path.join(repositoryDirectory, 'package.json'), 'utf8'),
    ) as RuntimePackageManifest;
    const dependencies = getRuntimeBrowserConsumerDependencies(packageManifest);

    await runBun(['run', 'build'], repositoryDirectory);
    await runBun(['pm', 'pack', '--destination', fixtureDirectory, '--quiet'], repositoryDirectory);

    const packageArchive = (await readdir(fixtureDirectory)).find((entry) =>
      entry.endsWith('.tgz'),
    );
    if (!packageArchive) throw new Error('Runtime package archive was not created.');

    await writeBrowserConsumerFiles(
      consumerDirectory,
      path.join(fixtureDirectory, packageArchive),
      dependencies,
    );
    await runBun(['install', '--ignore-scripts'], consumerDirectory);

    return { consumerDirectory, fixtureDirectory };
  } catch (error) {
    await rm(fixtureDirectory, { force: true, recursive: true });
    throw error;
  }
}

test('the packed production build is JSX-free and bundles through the standard browser resolver', async () => {
  const { consumerDirectory, fixtureDirectory } = await createPackedConsumerDirectory();

  try {
    const manifestContextSource = await readFile(
      path.join(
        consumerDirectory,
        'node_modules',
        '@ankhorage',
        'runtime',
        'dist',
        'ManifestContext.js',
      ),
      'utf8',
    );

    expect(manifestContextSource).not.toContain('<ManifestContext');
    await runBun(
      ['build', 'runtime-entry.ts', '--target=browser', '--format=esm', '--outdir=browser-dist'],
      consumerDirectory,
    );
  } finally {
    await rm(fixtureDirectory, { force: true, recursive: true });
  }
}, 120_000);
