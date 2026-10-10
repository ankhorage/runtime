import type { AppManifest, ScreenSpec, StateAdapter } from '@ankhorage/contracts';
import React from 'react';

import type { ComponentRegistry } from './registry';
import { createRuntimeApiCapabilityExecutor } from './runtimeApiCapabilities';
import { composeRuntimeCapabilityExecutor } from './runtimeCapabilityExecutor';
import { RuntimeRenderer } from './RuntimeRenderer';
import { useRuntimeRendererConfig } from './RuntimeRendererConfig';
import { useRuntimeScreenOperationLoaders } from './runtimeScreenLoaders';
import { createRuntimeMemoryStateAdapter } from './runtimeStateAdapter';

export interface RuntimeScreenProps {
  readonly manifest: AppManifest;
  readonly screen: ScreenSpec;
  readonly registry?: ComponentRegistry;
  readonly stateAdapter?: StateAdapter;
}

export function RuntimeScreen(props: RuntimeScreenProps) {
  const { manifest, screen, registry, stateAdapter: injectedStateAdapter } = props;
  const runtimeConfig = useRuntimeRendererConfig();
  const apiCapabilityExecutor = React.useMemo(
    () => createRuntimeApiCapabilityExecutor({ apis: manifest.infra.apis ?? {} }),
    [manifest.infra.apis],
  );
  const executeCapability = React.useMemo(
    () =>
      composeRuntimeCapabilityExecutor({
        apiCapabilityExecutor,
        capabilityExecutor: runtimeConfig.executeCapability,
      }),
    [apiCapabilityExecutor, runtimeConfig.executeCapability],
  );
  const fallbackStateAdapter = React.useMemo(() => createRuntimeMemoryStateAdapter(), []);
  const stateAdapter = injectedStateAdapter ?? fallbackStateAdapter;
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
