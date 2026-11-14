import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'bun:test';

function listJavaScriptArtifactPaths(directoryPath: string): string[] {
  return readdirSync(directoryPath, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directoryPath, entry.name);
    if (entry.isDirectory()) {
      return listJavaScriptArtifactPaths(entryPath);
    }

    return entry.name.endsWith('.js') ? [entryPath] : [];
  });
}

describe('browser-consumable runtime artifacts', () => {
  it('emits JavaScript that Node can parse without a JSX transform', () => {
    const artifactPaths = listJavaScriptArtifactPaths(path.join(import.meta.dir, '..', 'dist'));
    const nodeExecutablePath = Bun.which('node');

    expect(artifactPaths.length).toBeGreaterThan(0);
    if (nodeExecutablePath === null)
      throw new Error('Node is required to parse published artifacts.');

    for (const artifactPath of artifactPaths) {
      const syntaxCheck = spawnSync(nodeExecutablePath, ['--check', artifactPath], {
        encoding: 'utf8',
      });

      expect(syntaxCheck.status, `${artifactPath}\n${syntaxCheck.stderr}`).toBe(0);
    }
  });
});
