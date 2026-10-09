import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'bun:test';

import { CAPABILITIES } from '../src/capabilities/index';
import {
  createRuntimeManifest,
  defineRuntimeAction,
  defineRuntimeAdapter,
  defineRuntimeBinding,
  RUNTIME_MANIFEST_KIND,
} from '../src/runtimeManifest';

const PACKAGE_METADATA = JSON.parse(
  readFileSync(join(import.meta.dir, '..', 'package.json'), 'utf8'),
) as { readonly ankh: { readonly capabilities: unknown } };

describe('runtime contracts', () => {
  it('publishes canonical runtime capabilities', () => {
    expect(CAPABILITIES.map((capability) => capability.id)).toEqual([
      'runtime.render',
      'runtime.actions',
      'runtime.bindings',
      'runtime.eventOperation',
      'runtime.repeat.item',
    ]);
    expect(CAPABILITIES.map((capability) => capability.owner)).toEqual([
      '@ankhorage/runtime',
      '@ankhorage/runtime',
      '@ankhorage/runtime',
      '@ankhorage/runtime',
      '@ankhorage/runtime',
    ]);
    expect(CAPABILITIES.map((capability) => capability.binding)).toEqual([
      { kind: 'action', bindableAs: ['target'] },
      { kind: 'action', bindableAs: ['target'] },
      { kind: 'state', bindableAs: ['source', 'target'] },
      { kind: 'context', bindableAs: ['source'] },
      { kind: 'context', bindableAs: ['source'] },
    ]);
    expect(PACKAGE_METADATA.ankh.capabilities).toEqual(CAPABILITIES);
  });

  it('creates a serializable runtime manifest', () => {
    const action = defineRuntimeAction({
      capability: 'runtime.actions',
      data: {
        method: 'open',
      },
      id: 'open-profile',
    });
    const binding = defineRuntimeBinding({
      actionId: action.id,
      id: 'bind-profile-button',
      source: 'profile-button',
      target: 'open-profile',
    });
    const adapter = defineRuntimeAdapter({
      id: 'web-adapter',
      kind: 'web',
    });

    const manifest = createRuntimeManifest({
      actions: [action],
      adapters: [adapter],
      bindings: [binding],
      config: {
        appId: 'demo',
        environment: 'test',
      },
    });

    expect(manifest).toEqual({
      actions: [action],
      adapters: [adapter],
      bindings: [binding],
      config: {
        appId: 'demo',
        environment: 'test',
      },
      diagnostics: [],
      kind: RUNTIME_MANIFEST_KIND,
      version: 1,
    });
    expect(JSON.parse(JSON.stringify(manifest))).toEqual(manifest);
  });
});
