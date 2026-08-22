import type { AppManifest, ScreenSpec, StateAdapter } from '@ankhorage/contracts';
import React from 'react';

import type { ComponentRegistry } from './registry';
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
  const fallbackStateAdapter = React.useMemo(() => createRuntimeMemoryStateAdapter(), []);
  const stateAdapter = injectedStateAdapter ?? fallbackStateAdapter;
  const { apis } = manifest.infra;
  const screenOperationLoaders = useRuntimeScreenOperationLoaders({
    apis,
    bindingContext: runtimeConfig.bindingContext,
    executeOperation: runtimeConfig.executeOperation,
    operationResults: runtimeConfig.operationResults,
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
      apis={apis}
      dataBindings={manifest.dataBindings}
      mediaAssets={manifest.media?.assets}
      operationResults={screenOperationLoaders.operationResults}
    />
  );
}
