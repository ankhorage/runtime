import { describe, expect, it } from 'bun:test';

import {
  createRuntimeManifest,
  defineRuntimeAction,
  defineRuntimeAdapter,
  defineRuntimeBinding,
  listRuntimeCapabilities,
  RUNTIME_MANIFEST_KIND,
} from '../src/runtimeManifest';

describe('runtime contracts', () => {
  it('lists metadata capabilities', () => {
    expect(listRuntimeCapabilities()).toEqual([
      'runtime.render',
      'runtime.actions',
      'runtime.bindings',
      'runtime.adapters',
    ]);
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
