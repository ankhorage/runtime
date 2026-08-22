import type {
  Action,
  ApiDefinitionList,
  ComponentDataBindingRegistry,
  ComponentEventDto,
  DataSourceDiagnostic,
  DbAdapter,
  DbRealtimeAdapter,
  MediaAssetRegistry,
  StateAdapter,
  UiNode,
} from '@ankhorage/contracts';
import type { RuntimeNodePropsResolver } from '@ankhorage/contracts/runtime';
import React, { createContext, use } from 'react';

import type { ComponentRegistry } from './registry';
import type {
  RuntimeBindingOperationExecutor,
  RuntimeBindingOperationResultCache,
  RuntimeBindingOperationResultWriter,
} from './runtimeBindings';
import type { RuntimeMediaAssetResolver } from './runtimeMedia';

export type {
  RuntimeNodePropsResolver,
  RuntimeResolveNodePropsArgs,
} from '@ankhorage/contracts/runtime';

export interface RuntimeRendererWrapArgs {
  node: UiNode;
  rendered: React.ReactNode;
  isRoot: boolean;
}

export interface RuntimeActionHandlerArgs {
  action: RuntimeAction;
  event?: ComponentEventDto<string, object>;
  node?: UiNode;
  resolvedPayload?: object;
}

export type RuntimeAction = Action | { readonly type: string; readonly payload?: object };
export type RuntimeActionHandler = (args: RuntimeActionHandlerArgs) => Promise<void> | void;
export type RuntimeActionHandlers = Record<string, RuntimeActionHandler>;
export type RuntimeActionExecutor = RuntimeActionHandler;

export interface RuntimeRendererConfig {
  disableActions?: boolean;
  registry?: ComponentRegistry;
  wrapNode?: (args: RuntimeRendererWrapArgs) => React.ReactNode;
  resolveNodeProps?: RuntimeNodePropsResolver;
  resolveMediaAsset?: RuntimeMediaAssetResolver;
  mediaAssets?: MediaAssetRegistry;
  actionHandlers?: RuntimeActionHandlers;
  dbAdapter?: DbAdapter;
  dbRealtimeAdapter?: DbRealtimeAdapter;
  stateAdapter?: StateAdapter;
  bindingContext?: Record<string, unknown>;
  apis?: ApiDefinitionList;
  dataBindings?: ComponentDataBindingRegistry;
  operationResults?: RuntimeBindingOperationResultCache;
  writeOperationResult?: RuntimeBindingOperationResultWriter;
  executeAction?: RuntimeActionExecutor;
  executeOperation?: RuntimeBindingOperationExecutor;
  onDiagnostics?: (diagnostics: readonly DataSourceDiagnostic[]) => void;
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

  const actionHandlers = mergeRecordConfig(
    inheritedConfig?.actionHandlers,
    localConfig?.actionHandlers,
  );
  const bindingContext = mergeRecordConfig(
    inheritedConfig?.bindingContext,
    localConfig?.bindingContext,
  );
  const operationResults = mergeRecordConfig(
    inheritedConfig?.operationResults,
    localConfig?.operationResults,
  );

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
    actionHandlers,
    dbAdapter: localConfig?.dbAdapter ?? inheritedConfig?.dbAdapter,
    dbRealtimeAdapter: localConfig?.dbRealtimeAdapter ?? inheritedConfig?.dbRealtimeAdapter,
    stateAdapter: localConfig?.stateAdapter ?? inheritedConfig?.stateAdapter,
    bindingContext,
    apis: localConfig?.apis ?? inheritedConfig?.apis,
    dataBindings: localConfig?.dataBindings ?? inheritedConfig?.dataBindings,
    operationResults,
    writeOperationResult:
      localConfig?.writeOperationResult ?? inheritedConfig?.writeOperationResult,
    executeAction: localConfig?.executeAction ?? inheritedConfig?.executeAction,
    executeOperation: localConfig?.executeOperation ?? inheritedConfig?.executeOperation,
    onDiagnostics: localConfig?.onDiagnostics ?? inheritedConfig?.onDiagnostics,
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
