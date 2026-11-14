import type { UiNode } from '@ankhorage/contracts';
import { describe, expect, it } from 'bun:test';

import {
  createRuntimeAuthoringOverlayConfig,
  type RuntimeAuthoringOverlayNodeArgs,
} from './runtimeAuthoringOverlay';
import { mergeRuntimeRendererConfig } from './RuntimeRendererConfig';

const node = { id: 'profile-card', type: 'Card' } as UiNode;

describe('runtime authoring overlay adapter', () => {
  it('forwards the host component identity and platform-neutral overlay callbacks', () => {
    const fixture = createInstrumentedAdapter();
    const result = fixture.config.wrapNode?.({
      isRoot: false,
      node,
      rendered: fixture.rendered,
    });

    expect(result).toBe(fixture.rendered);
    expect(fixture.state.wrapped?.component).toEqual({ componentId: 'host:profile-card', node });
    expect(fixture.state.wrapped?.select({ x: 4, y: 8 })).toBe(true);
    fixture.state.wrapped?.reportBounds({ x: 1, y: 2, width: 30, height: 40 });
    expect(fixture.state.wrapped?.arbitrateGesture({ kind: 'long-press' })).toBe('drag');
    expect(fixture.selections).toEqual([
      { componentId: 'host:profile-card', input: { x: 4, y: 8 }, node },
    ]);
    expect(fixture.bounds).toEqual([
      {
        bounds: { height: 40, width: 30, x: 1, y: 2 },
        componentId: 'host:profile-card',
        node,
      },
    ]);
    expect(fixture.gestures).toEqual([
      { componentId: 'host:profile-card', input: { kind: 'long-press' }, node },
    ]);
  });

  it('keeps the rendered node untouched when the host cannot identify it', () => {
    let wrapCount = 0;
    const config = createRuntimeAuthoringOverlayConfig({
      mode: 'edit',
      getComponentId: () => undefined,
      wrapNode: (args) => {
        wrapCount += 1;
        return args.rendered;
      },
    });
    const rendered = 'host-rendered-node';

    expect(config.wrapNode?.({ isRoot: false, node, rendered })).toBe(rendered);
    expect(wrapCount).toBe(0);
  });

  it('suppresses executable actions in edit mode without allowing preview to re-enable an outer block', () => {
    const editConfig = createRuntimeAuthoringOverlayConfig(createAdapter('edit'));
    const previewConfig = createRuntimeAuthoringOverlayConfig(createAdapter('preview'));

    expect(editConfig.disableActions).toBe(true);
    expect(previewConfig.disableActions).toBeUndefined();
    expect(mergeRuntimeRendererConfig(previewConfig, editConfig).disableActions).toBe(true);
  });
});

function createInstrumentedAdapter() {
  const selections: unknown[] = [];
  const bounds: unknown[] = [];
  const gestures: unknown[] = [];
  const state: { wrapped?: RuntimeAuthoringOverlayNodeArgs } = {};
  const config = createRuntimeAuthoringOverlayConfig({
    mode: 'edit',
    getComponentId: (candidate) => `host:${candidate.id}`,
    hitTest: (args) => {
      selections.push(args);
      return true;
    },
    onBounds: (args) => bounds.push(args),
    arbitrateGesture: (args) => {
      gestures.push(args);
      return 'drag';
    },
    wrapNode: (args) => {
      state.wrapped = args;
      return args.rendered;
    },
  });

  return { bounds, config, gestures, rendered: 'host-rendered-node', selections, state };
}

function createAdapter(mode: 'edit' | 'preview') {
  return {
    mode,
    getComponentId: (candidate: UiNode) => candidate.id,
    wrapNode: (args: RuntimeAuthoringOverlayNodeArgs) => args.rendered,
  } as const;
}
