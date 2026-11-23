import type { AppManifest, ScreenSpec, StateAdapter } from '@ankhorage/contracts';
import React from 'react';

import { useOptionalManifestContext } from './ManifestContext.js';
import type { ComponentRegistry } from './registry.js';
import { composeRuntimeCapabilityExecutor } from './runtimeCapabilityExecutor.js';
import { RuntimeRenderer } from './RuntimeRenderer.js';
import { useRuntimeRendererConfig } from './RuntimeRendererConfig.js';
import { useRuntimeScreenOperationLoaders } from './runtimeScreenLoaders.js';
import { createRuntimeMemoryStateAdapter } from './runtimeStateAdapter.js';

export interface RuntimeScreenProps {
  readonly manifest: AppManifest;
  readonly screen: ScreenSpec;
  readonly registry?: ComponentRegistry;
  readonly stateAdapter?: StateAdapter;
}

export function RuntimeScreen(props: RuntimeScreenProps) {
  const { manifest, screen, registry, stateAdapter: injectedStateAdapter } = props;
  const runtimeConfig = useRuntimeRendererConfig();
  const manifestContext = useOptionalManifestContext();
  const fallbackStateAdapter = React.useMemo(
    () => (manifest.state?.provider === 'legend' ? createRuntimeMemoryStateAdapter() : undefined),
    [manifest.state?.provider],
  );
  const stateAdapter =
    injectedStateAdapter ?? manifestContext?.stateAdapter ?? fallbackStateAdapter;
  const executeCapability = React.useMemo(
    () =>
      composeRuntimeCapabilityExecutor({
        capabilityExecutor: runtimeConfig.executeCapability,
        flowPort: runtimeConfig.flowPort,
        stateAdapter,
      }),
    [runtimeConfig.executeCapability, runtimeConfig.flowPort, stateAdapter],
  );
  const screenOperationLoaders = useRuntimeScreenOperationLoaders({
    bindingContext: runtimeConfig.bindingContext,
    executeCapability,
    resultSlots: runtimeConfig.resultSlots,
    onDiagnostics: runtimeConfig.onDiagnostics,
    screen,
  });

  return (
    <RuntimeRenderer
      key={`${screen.id}:${screenOperationLoaders.renderVersion}`}
      node={screen.root}
      isRoot
      registry={registry}
      stateAdapter={stateAdapter}
      dataBindings={manifest.dataBindings}
      mediaAssets={manifest.media?.assets}
      resultSlots={screenOperationLoaders.resultSlots}
      executeCapability={executeCapability}
    />
  );
}
