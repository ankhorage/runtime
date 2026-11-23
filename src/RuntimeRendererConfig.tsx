import type {
  BindingValue,
  ComponentDataBindingRegistry,
  DataSourceDiagnostic,
  DbAdapter,
  DbRealtimeAdapter,
  MediaAssetRegistry,
  StateAdapter,
  UiNode,
} from '@ankhorage/contracts';
import type { RuntimeNodePropsResolver } from '@ankhorage/contracts/runtime';
import React, { createContext, use } from 'react';

import type { ComponentRegistry } from './registry.js';
import type { RuntimeEventCapabilityResolver } from './runtimeActionRegistry.js';
import type {
  RuntimeBindingResultCache,
  RuntimeBindingResultWriter,
  RuntimeCapabilityExecutor,
} from './runtimeBindings.js';
import type {
  RuntimeEventOperationLifecycle,
  RuntimeEventOperationState,
} from './runtimeEventOperationLifecycle.js';
import type { RuntimeMediaAssetResolver } from './runtimeMedia.js';
import type { RuntimeFlowPort } from './types/runtimeFlow.js';

export type {
  RuntimeNodePropsResolver,
  RuntimeResolveNodePropsArgs,
} from '@ankhorage/contracts/runtime';

export interface RuntimeRendererWrapArgs {
  node: UiNode;
  rendered: React.ReactNode;
  isRoot: boolean;
}

export interface RuntimeRendererConfig {
  disableActions?: boolean;
  registry?: ComponentRegistry;
  wrapNode?: (args: RuntimeRendererWrapArgs) => React.ReactNode;
  resolveNodeProps?: RuntimeNodePropsResolver;
  resolveMediaAsset?: RuntimeMediaAssetResolver;
  mediaAssets?: MediaAssetRegistry;
  dbAdapter?: DbAdapter;
  dbRealtimeAdapter?: DbRealtimeAdapter;
  stateAdapter?: StateAdapter;
  bindingContext?: Record<string, unknown>;
  capabilityValues?: Readonly<Record<string, BindingValue | undefined>>;
  dataBindings?: ComponentDataBindingRegistry;
  resultSlots?: RuntimeBindingResultCache;
  writeResultSlot?: RuntimeBindingResultWriter;
  /*** Executes side-effecting capabilities in the trusted application host.
   *
   * API capabilities are never created from manifest configuration by RuntimeScreen. A host that
   * resolves credentials must compose its server-side resolver and transport here; browser hosts
   * must not provide credential resolution.
   *
   * @security
   */
  executeCapability?: RuntimeCapabilityExecutor;
  flowPort?: RuntimeFlowPort;
  resolveEventCapability?: RuntimeEventCapabilityResolver;
  onDiagnostics?: (diagnostics: readonly DataSourceDiagnostic[]) => void;
  eventOperationLifecycle?: RuntimeEventOperationLifecycle;
  eventOperationState?: RuntimeEventOperationState;
}

const EMPTY_RUNTIME_RENDERER_CONFIG: RuntimeRendererConfig = {};

const RuntimeRendererConfigContext = createContext<RuntimeRendererConfig>(
  EMPTY_RUNTIME_RENDERER_CONFIG,
);

export function composeRuntimeRendererWrapNode(
  innerWrapNode?: RuntimeRendererConfig['wrapNode'],
  outerWrapNode?: RuntimeRendererConfig['wrapNode'],
): RuntimeRendererConfig['wrapNode'] {
  if (!innerWrapNode) {
    return outerWrapNode;
  }

  if (!outerWrapNode) {
    return innerWrapNode;
  }

  return (args) => outerWrapNode({ ...args, rendered: innerWrapNode(args) });
}

export function composeRuntimeNodePropsResolver(
  localResolver?: RuntimeRendererConfig['resolveNodeProps'],
  inheritedResolver?: RuntimeRendererConfig['resolveNodeProps'],
): RuntimeRendererConfig['resolveNodeProps'] {
  if (!localResolver) {
    return inheritedResolver;
  }

  if (!inheritedResolver) {
    return localResolver;
  }

  return (args) => {
    const inheritedProps = inheritedResolver(args);
    return localResolver({ ...args, props: inheritedProps });
  };
}

export function mergeRuntimeRendererConfig(
  localConfig: RuntimeRendererConfig | undefined,
  inheritedConfig: RuntimeRendererConfig | undefined,
): RuntimeRendererConfig {
  if (!localConfig && !inheritedConfig) {
    return EMPTY_RUNTIME_RENDERER_CONFIG;
  }

  const bindingContext = mergeRecordConfig(
    inheritedConfig?.bindingContext,
    localConfig?.bindingContext,
  );
  const capabilityValues = mergeRecordConfig(
    inheritedConfig?.capabilityValues,
    localConfig?.capabilityValues,
  );
  const resultSlots = mergeRecordConfig(inheritedConfig?.resultSlots, localConfig?.resultSlots);

  return {
    disableActions:
      localConfig?.disableActions === true || inheritedConfig?.disableActions === true,
    registry: localConfig?.registry ?? inheritedConfig?.registry,
    wrapNode: composeRuntimeRendererWrapNode(localConfig?.wrapNode, inheritedConfig?.wrapNode),
    resolveNodeProps: composeRuntimeNodePropsResolver(
      localConfig?.resolveNodeProps,
      inheritedConfig?.resolveNodeProps,
    ),
    resolveMediaAsset: localConfig?.resolveMediaAsset ?? inheritedConfig?.resolveMediaAsset,
    mediaAssets: localConfig?.mediaAssets ?? inheritedConfig?.mediaAssets,
    dbAdapter: localConfig?.dbAdapter ?? inheritedConfig?.dbAdapter,
    dbRealtimeAdapter: localConfig?.dbRealtimeAdapter ?? inheritedConfig?.dbRealtimeAdapter,
    stateAdapter: localConfig?.stateAdapter ?? inheritedConfig?.stateAdapter,
    bindingContext,
    capabilityValues,
    dataBindings: localConfig?.dataBindings ?? inheritedConfig?.dataBindings,
    resultSlots,
    writeResultSlot: localConfig?.writeResultSlot ?? inheritedConfig?.writeResultSlot,
    executeCapability: localConfig?.executeCapability ?? inheritedConfig?.executeCapability,
    flowPort: localConfig?.flowPort ?? inheritedConfig?.flowPort,
    resolveEventCapability:
      localConfig?.resolveEventCapability ?? inheritedConfig?.resolveEventCapability,
    onDiagnostics: localConfig?.onDiagnostics ?? inheritedConfig?.onDiagnostics,
    eventOperationLifecycle:
      localConfig?.eventOperationLifecycle ?? inheritedConfig?.eventOperationLifecycle,
    eventOperationState: localConfig?.eventOperationState ?? inheritedConfig?.eventOperationState,
  };
}

export function RuntimeRendererConfigProvider(props: {
  value: RuntimeRendererConfig;
  children: React.ReactNode;
}) {
  const { value, children } = props;
  const inheritedConfig = use(RuntimeRendererConfigContext);
  const mergedConfig = mergeRuntimeRendererConfig(value, inheritedConfig);

  return (
    <RuntimeRendererConfigContext value={mergedConfig}>{children}</RuntimeRendererConfigContext>
  );
}

export function useRuntimeRendererConfig(): RuntimeRendererConfig {
  return use(RuntimeRendererConfigContext);
}

function mergeRecordConfig<TValue>(
  inherited: Readonly<Record<string, TValue>> | undefined,
  local: Readonly<Record<string, TValue>> | undefined,
): Record<string, TValue> | undefined {
  if (!inherited && !local) return undefined;

  return {
    ...(inherited ?? {}),
    ...(local ?? {}),
  };
}
