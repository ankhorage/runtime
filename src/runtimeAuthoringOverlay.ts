import type { UiNode } from '@ankhorage/contracts';
import type React from 'react';

import type { RuntimeRendererConfig, RuntimeRendererWrapArgs } from './RuntimeRendererConfig';

export type RuntimeAuthoringMode = 'edit' | 'preview';

export interface RuntimeAuthoringBounds {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export type RuntimeAuthoringGestureDisposition = 'pass-through' | 'select' | 'drag';

export interface RuntimeAuthoringComponentIdentity {
  readonly componentId: string;
  readonly node: UiNode;
}

export interface RuntimeAuthoringOverlayNodeArgs extends RuntimeRendererWrapArgs {
  readonly component: RuntimeAuthoringComponentIdentity;
  readonly reportBounds: (bounds: RuntimeAuthoringBounds) => void;
  readonly select: (input: unknown) => boolean;
  readonly arbitrateGesture: (input: unknown) => RuntimeAuthoringGestureDisposition;
}

export interface RuntimeAuthoringOverlayAdapter {
  readonly mode: RuntimeAuthoringMode;
  readonly getComponentId: (node: UiNode) => string | undefined;
  readonly wrapNode: (args: RuntimeAuthoringOverlayNodeArgs) => React.ReactNode;
  readonly hitTest?: (
    args: RuntimeAuthoringComponentIdentity & { readonly input: unknown },
  ) => boolean;
  readonly onBounds?: (
    args: RuntimeAuthoringComponentIdentity & { readonly bounds: RuntimeAuthoringBounds },
  ) => void;
  readonly arbitrateGesture?: (
    args: RuntimeAuthoringComponentIdentity & { readonly input: unknown },
  ) => RuntimeAuthoringGestureDisposition;
}

/*** Creates the renderer configuration that connects a host authoring overlay without importing its UI toolkit. */
export function createRuntimeAuthoringOverlayConfig(
  adapter: RuntimeAuthoringOverlayAdapter,
): Pick<RuntimeRendererConfig, 'disableActions' | 'wrapNode'> {
  return {
    ...(adapter.mode === 'edit' ? { disableActions: true } : {}),
    wrapNode: (args) => wrapRuntimeAuthoringOverlayNode(adapter, args),
  };
}

/*** Delivers stable component identity and host callbacks to a concrete overlay wrapper when the node has an identity. */
function wrapRuntimeAuthoringOverlayNode(
  adapter: RuntimeAuthoringOverlayAdapter,
  args: RuntimeRendererWrapArgs,
): React.ReactNode {
  const componentId = adapter.getComponentId(args.node);
  if (!componentId) {
    return args.rendered;
  }

  const component = { componentId, node: args.node };
  return adapter.wrapNode({
    ...args,
    component,
    reportBounds: (bounds) => adapter.onBounds?.({ ...component, bounds }),
    select: (input) => adapter.hitTest?.({ ...component, input }) ?? false,
    arbitrateGesture: (input) =>
      adapter.arbitrateGesture?.({ ...component, input }) ?? 'pass-through',
  });
}
