import { readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'bun:test';

/*** Verifies the packed server API entrypoint stays separate from the React Native renderer graph. */
async function packRuntimeArtifactAsync(): Promise<{
  readonly artifactPath: string;
  readonly directoryPath: string;
}> {
  const directoryPath =
    await Bun.$`mktemp -d ${path.join(tmpdir(), 'ankhorage-runtime-server-api-XXXXXX')}`.text();
  const normalizedDirectoryPath = directoryPath.trim();
  const npmCacheDirectory = path.join(normalizedDirectoryPath, 'npm-cache');
  const packResult =
    await Bun.$`env npm_config_cache=${npmCacheDirectory} npm pack --ignore-scripts --pack-destination ${normalizedDirectoryPath}`.quiet();

  expect(packResult.exitCode).toBe(0);
  const artifacts = await readdir(normalizedDirectoryPath);
  const artifact = artifacts.find((candidate) => candidate.endsWith('.tgz'));
  if (artifact === undefined) throw new Error('Expected npm pack to create a Runtime artifact.');

  return {
    artifactPath: path.join(normalizedDirectoryPath, artifact),
    directoryPath: normalizedDirectoryPath,
  };
}

describe('server API capability artifact', () => {
  it('imports the public API capability subpath from a packed Bun consumer without React Native', async () => {
    const packedArtifact = await packRuntimeArtifactAsync();
    const consumerPath = path.join(packedArtifact.directoryPath, 'consumer');

    try {
      await Bun.write(
        path.join(packedArtifact.directoryPath, 'package.json'),
        JSON.stringify({ private: true, type: 'module' }),
      );
      await Bun.$`mkdir -p ${consumerPath}`;
      await Bun.write(
        path.join(consumerPath, 'package.json'),
        JSON.stringify({
          dependencies: { '@ankhorage/runtime': `file:${packedArtifact.artifactPath}` },
          private: true,
          type: 'module',
        }),
      );
      await Bun.write(
        path.join(consumerPath, 'index.ts'),
        "import { createRuntimeApiCapabilityExecutor } from '@ankhorage/runtime/api-capabilities';\n" +
          "if (typeof createRuntimeApiCapabilityExecutor !== 'function') throw new Error('Missing API executor.');\n",
      );

      const bunCacheDirectory = path.join(packedArtifact.directoryPath, 'bun-cache');
      const install = await Bun.$`env BUN_INSTALL_CACHE_DIR=${bunCacheDirectory} bun install`
        .cwd(consumerPath)
        .quiet();
      expect(install.exitCode).toBe(0);
      await rm(path.join(consumerPath, 'node_modules', 'react-native'), {
        force: true,
        recursive: true,
      });
      const execution = await Bun.$`bun index.ts`.cwd(consumerPath).quiet();

      expect(execution.exitCode).toBe(0);
    } finally {
      await rm(packedArtifact.directoryPath, { force: true, recursive: true });
    }
  }, 60_000);
});
