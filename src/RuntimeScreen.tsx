import type {
  AppManifest,
  ComponentDataBindingRegistry,
  PropBinding,
  ScreenSpec,
  StateAdapter,
} from '@ankhorage/contracts';
import React from 'react';

import type { ComponentRegistry } from './registry';
import type { RuntimeApiLoaderDefinition } from './runtimeApiLoaders';
import { useRuntimeApiStateLoaders } from './runtimeApiLoaders';
import { RuntimeRenderer } from './RuntimeRenderer';
import { useRuntimeRendererConfig } from './RuntimeRendererConfig';
import { resolveScreenApiLoaders, useRuntimeScreenOperationLoaders } from './runtimeScreenLoaders';

export interface RuntimeScreenProps {
  readonly manifest: AppManifest;
  readonly screen: ScreenSpec;
  readonly registry?: ComponentRegistry;
  readonly stateAdapter?: StateAdapter;
}

export function RuntimeScreen(props: RuntimeScreenProps) {
  const { manifest, screen, registry, stateAdapter: injectedStateAdapter } = props;
  const runtimeConfig = useRuntimeRendererConfig();
  const loaders = React.useMemo(
    () => [
      ...resolveScreenApiLoaders(screen),
      ...resolveApiLoadersFromBindings(manifest.dataBindings),
    ],
    [manifest.dataBindings, screen],
  );
  const { stateAdapter, stateVersion } = useRuntimeApiStateLoaders({
    data: manifest.data,
    loaders,
    stateAdapter: injectedStateAdapter,
  });
  const screenOperationLoaders = useRuntimeScreenOperationLoaders({
    bindingContext: runtimeConfig.bindingContext,
    dataSources: manifest.dataSources,
    executeOperation: runtimeConfig.executeOperation,
    operationResults: runtimeConfig.operationResults,
    onDiagnostics: runtimeConfig.onDiagnostics,
    screen,
  });

  return (
    <RuntimeRenderer
      key={`${screen.id}:${stateVersion}:${screenOperationLoaders.renderVersion}`}
      node={screen.root}
      isRoot
      registry={registry}
      stateAdapter={stateAdapter}
      dataBindings={manifest.dataBindings}
      dataSources={manifest.dataSources}
      operationResults={screenOperationLoaders.operationResults}
    />
  );
}

function resolveApiLoadersFromBindings(
  dataBindings: ComponentDataBindingRegistry | undefined,
): readonly RuntimeApiLoaderDefinition[] {
  const loadersByApiId = new Map<string, RuntimeApiLoaderDefinition>();

  for (const componentBinding of Object.values(dataBindings ?? {})) {
    for (const binding of Object.values(componentBinding.props ?? {})) {
      const loader = resolveApiLoaderFromPropBinding(binding);
      if (loader !== null && !loadersByApiId.has(loader.apiId)) {
        loadersByApiId.set(loader.apiId, loader);
      }
    }
  }

  return [...loadersByApiId.values()].sort((left, right) => left.apiId.localeCompare(right.apiId));
}

function resolveApiLoaderFromPropBinding(binding: PropBinding): RuntimeApiLoaderDefinition | null {
  if (binding.source.kind !== 'state') {
    return null;
  }

  const parts = binding.source.path
    .split('.')
    .map((part) => part.trim())
    .filter(Boolean);
  const [root, apiId, collectionSlot] = parts;
  if (root !== 'apis' || apiId === undefined || collectionSlot !== 'current') {
    return null;
  }

  return {
    kind: 'api',
    apiId,
    mode: 'one',
    targetPath: `apis.${apiId}.current`,
  };
}
