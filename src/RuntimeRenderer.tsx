import type {
  ApiDefinitionList,
  BindingValue,
  ComponentDataBindingRegistry,
  DataSourceDiagnostic,
  DbAdapter,
  DbRealtimeAdapter,
  MediaAssetRegistry,
  StateAdapter,
  UiNode,
} from '@ankhorage/contracts';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { ComponentRegistry } from './registry';
import {
  getUnknownComponentDiagnostic,
  resolveRenderedChildren,
  resolveRuntimeRegistry,
} from './rendering';
import {
  type RuntimeComponentEventDispatchArgs,
  wrapRuntimeEventProps,
} from './runtimeActionRegistry';
import type {
  RuntimeBindingOperationExecutor,
  RuntimeBindingOperationKey,
  RuntimeBindingOperationResultCache,
} from './runtimeBindings';
import { createDbPersistActionHandler } from './runtimeDbPersist';
import { dispatchRuntimeComponentEventWithReporting } from './runtimeEventExecution';
import type { RuntimeMediaAssetResolver } from './runtimeMedia';
import {
  RuntimeMediaResolutionCacheProvider,
  useRuntimeMediaResolutionCache,
} from './runtimeMediaCache';
import { resolveRuntimeNodeProps, wrapRuntimeActionProps } from './runtimeNodeProps';
import type { RuntimeActionHandlerArgs } from './RuntimeRendererConfig';
import {
  mergeRuntimeRendererConfig,
  type RuntimeActionExecutor,
  RuntimeRendererConfigProvider,
  type RuntimeRendererWrapArgs,
  useRuntimeRendererConfig,
} from './RuntimeRendererConfig';
import {
  createRuntimeRepeatBindingContext,
  resolveRuntimeRepeatItemKey,
  resolveRuntimeRepeatItemsAsync,
  resolveRuntimeRepeatItemsSync,
} from './runtimeRepeat';
import { createRepeatDiagnosticsKey } from './runtimeRepeatDiagnostics';
import { shouldRenderRuntimeRepeatEmptyState } from './runtimeRepeatEmptyState';
import { useRuntimeMediaProps } from './useRuntimeMediaProps';

export interface RuntimeRendererProps {
  node: UiNode;
  isRoot?: boolean;
  registry?: ComponentRegistry;
  disableActions?: boolean;
  wrapNode?: (args: RuntimeRendererWrapArgs) => React.ReactNode;
  dbAdapter?: DbAdapter;
  dbRealtimeAdapter?: DbRealtimeAdapter;
  stateAdapter?: StateAdapter;
  bindingContext?: Record<string, unknown>;
  apis?: ApiDefinitionList;
  dataBindings?: ComponentDataBindingRegistry;
  mediaAssets?: MediaAssetRegistry;
  resolveMediaAsset?: RuntimeMediaAssetResolver;
  operationResults?: RuntimeBindingOperationResultCache;
  executeAction?: RuntimeActionExecutor;
  executeOperation?: RuntimeBindingOperationExecutor;
  onDiagnostics?: (diagnostics: readonly DataSourceDiagnostic[]) => void;
}

export function RuntimeRenderer(props: RuntimeRendererProps) {
  const {
    node,
    isRoot = false,
    registry,
    disableActions = false,
    wrapNode,
    dbAdapter,
    dbRealtimeAdapter,
    stateAdapter,
    bindingContext,
    apis,
    dataBindings,
    mediaAssets,
    resolveMediaAsset,
    operationResults,
    executeAction,
    executeOperation,
    onDiagnostics,
  } = props;
  const inheritedConfig = useRuntimeRendererConfig();
  const mediaResolutionCache = useRuntimeMediaResolutionCache();
  const inheritedOperationResults = inheritedConfig.operationResults;
  const [localOperationResults, setLocalOperationResults] =
    React.useState<RuntimeBindingOperationResultCache>({});
  const writeLocalOperationResult = React.useCallback(
    (key: RuntimeBindingOperationKey, value: BindingValue) => {
      setLocalOperationResults((currentResults) => ({
        ...currentResults,
        [key]: value,
      }));
    },
    [],
  );
  const effectiveOperationResults = React.useMemo(
    () => ({
      ...(inheritedOperationResults ?? {}),
      ...(operationResults ?? {}),
      ...localOperationResults,
    }),
    [inheritedOperationResults, localOperationResults, operationResults],
  );
  const explicitConfig = React.useMemo(
    () => ({
      apis,
      bindingContext,
      dataBindings,
      dbAdapter,
      dbRealtimeAdapter,
      disableActions,
      executeAction,
      executeOperation,
      mediaAssets,
      operationResults: effectiveOperationResults,
      onDiagnostics,
      registry,
      resolveMediaAsset,
      stateAdapter,
      wrapNode,
      writeOperationResult: inheritedConfig.writeOperationResult ?? writeLocalOperationResult,
    }),
    [
      apis,
      bindingContext,
      dataBindings,
      dbAdapter,
      dbRealtimeAdapter,
      disableActions,
      executeAction,
      effectiveOperationResults,
      executeOperation,
      inheritedConfig.writeOperationResult,
      mediaAssets,
      onDiagnostics,
      registry,
      resolveMediaAsset,
      stateAdapter,
      wrapNode,
      writeLocalOperationResult,
    ],
  );
  const effectiveConfig = React.useMemo(
    () => mergeRuntimeRendererConfig(explicitConfig, inheritedConfig),
    [explicitConfig, inheritedConfig],
  );
  const effectiveActionHandlers = React.useMemo(() => {
    if (!effectiveConfig.dbAdapter) {
      return effectiveConfig.actionHandlers;
    }

    return {
      'db.persist': createDbPersistActionHandler({ dbAdapter: effectiveConfig.dbAdapter }),
      ...(effectiveConfig.actionHandlers ?? {}),
    };
  }, [effectiveConfig.actionHandlers, effectiveConfig.dbAdapter]);
  const executeRuntimeAction = React.useCallback(
    async (actionArgs: RuntimeActionHandlerArgs) => {
      if (effectiveConfig.executeAction) {
        await effectiveConfig.executeAction(actionArgs);
        return;
      }

      const handler = effectiveActionHandlers?.[actionArgs.action.type];
      if (handler) {
        await handler(actionArgs);
      }
    },
    [effectiveActionHandlers, effectiveConfig],
  );
  const dispatchRuntimeEvent = React.useCallback(
    async (eventArgs: RuntimeComponentEventDispatchArgs) => {
      await dispatchRuntimeComponentEventWithReporting({
        ...eventArgs,
        actionHandlers: effectiveActionHandlers,
        apis: eventArgs.apis ?? effectiveConfig.apis,
        dataBindings: eventArgs.dataBindings ?? effectiveConfig.dataBindings,
        executeAction: effectiveConfig.executeAction ?? executeRuntimeAction,
        executeOperation: eventArgs.executeOperation ?? effectiveConfig.executeOperation,
        onDiagnostics: effectiveConfig.onDiagnostics,
        operationResults: eventArgs.operationResults ?? effectiveConfig.operationResults,
        writeOperationResult:
          eventArgs.writeOperationResult ?? effectiveConfig.writeOperationResult,
      });
    },
    [effectiveActionHandlers, effectiveConfig, executeRuntimeAction],
  );
  const actionHandlerCache = React.useMemo(
    () =>
      new WeakMap<
        object,
        {
          readonly handleAction: (action: RuntimeActionHandlerArgs['action']) => void;
          readonly handler: (...args: unknown[]) => void;
        }
      >(),
    [],
  );
  const functionHandlerCache = React.useMemo(
    () => new WeakMap<(...args: unknown[]) => unknown, (...args: unknown[]) => unknown>(),
    [],
  );
  const handleAction = React.useCallback(
    (action: RuntimeActionHandlerArgs['action']) => {
      void executeRuntimeAction({ action });
    },
    [executeRuntimeAction],
  );
  const effectiveRegistry = React.useMemo(
    () =>
      resolveRuntimeRegistry({
        propRegistry: registry,
        configRegistry: effectiveConfig.registry,
      }),
    [effectiveConfig.registry, registry],
  );
  const Component = effectiveRegistry[node.type];

  const repeatSyncResult = React.useMemo(() => {
    const { repeat } = node;
    if (!repeat) {
      return null;
    }

    return resolveRuntimeRepeatItemsSync(repeat, {
      apis: effectiveConfig.apis,
      context: effectiveConfig.bindingContext,
      dataBindings: effectiveConfig.dataBindings,
      executeOperation: effectiveConfig.executeOperation,
      node,
      operationResults: effectiveConfig.operationResults,
      stateAdapter: effectiveConfig.stateAdapter,
      writeOperationResult: effectiveConfig.writeOperationResult,
    });
  }, [
    effectiveConfig.apis,
    effectiveConfig.bindingContext,
    effectiveConfig.dataBindings,
    effectiveConfig.executeOperation,
    effectiveConfig.operationResults,
    effectiveConfig.stateAdapter,
    effectiveConfig.writeOperationResult,
    node,
  ]);
  const repeatRequestToken = React.useMemo(
    () => (node.repeat && repeatSyncResult?.status === 'pending' ? {} : null),
    [node.repeat, repeatSyncResult],
  );
  const [asyncRepeatResult, setAsyncRepeatResult] = React.useState<{
    readonly requestToken: object;
    readonly items: readonly BindingValue[];
    readonly diagnostics: readonly DataSourceDiagnostic[];
  } | null>(null);
  const repeatRequestIdRef = React.useRef(0);
  const lastRepeatDiagnosticsKeyRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    repeatRequestIdRef.current += 1;
    const requestId = repeatRequestIdRef.current;
    const { repeat } = node;

    if (!repeat || repeatRequestToken === null) {
      return undefined;
    }

    void (async () => {
      const result = await resolveRuntimeRepeatItemsAsync(repeat, {
        apis: effectiveConfig.apis,
        context: effectiveConfig.bindingContext,
        dataBindings: effectiveConfig.dataBindings,
        executeOperation: effectiveConfig.executeOperation,
        node,
        operationResults: effectiveConfig.operationResults,
        stateAdapter: effectiveConfig.stateAdapter,
        writeOperationResult: effectiveConfig.writeOperationResult,
      });

      if (repeatRequestIdRef.current !== requestId) {
        return;
      }

      setAsyncRepeatResult({ ...result, requestToken: repeatRequestToken });
    })();

    return () => {
      repeatRequestIdRef.current += 1;
    };
  }, [
    effectiveConfig.apis,
    effectiveConfig.bindingContext,
    effectiveConfig.dataBindings,
    effectiveConfig.executeOperation,
    effectiveConfig.operationResults,
    effectiveConfig.stateAdapter,
    effectiveConfig.writeOperationResult,
    node,
    repeatRequestToken,
  ]);
  const currentAsyncRepeatResult =
    asyncRepeatResult?.requestToken === repeatRequestToken ? asyncRepeatResult : null;
  const repeatDiagnostics =
    repeatSyncResult?.status === 'ready'
      ? repeatSyncResult.diagnostics
      : currentAsyncRepeatResult?.diagnostics;

  React.useEffect(() => {
    if (!node.repeat || repeatDiagnostics === undefined) {
      return;
    }

    const diagnosticsKey = createRepeatDiagnosticsKey(node.id, repeatDiagnostics);
    if (lastRepeatDiagnosticsKeyRef.current === diagnosticsKey) {
      return;
    }

    lastRepeatDiagnosticsKeyRef.current = diagnosticsKey;
    effectiveConfig.onDiagnostics?.(repeatDiagnostics);
  }, [effectiveConfig, node, repeatDiagnostics]);

  const bindingResolvedProps = resolveRuntimeNodeProps({
    apis: effectiveConfig.apis,
    bindingContext: effectiveConfig.bindingContext,
    dataBindings: effectiveConfig.dataBindings,
    dbAdapter: effectiveConfig.dbAdapter,
    dbRealtimeAdapter: effectiveConfig.dbRealtimeAdapter,
    node,
    operationResults: effectiveConfig.operationResults,
    stateAdapter: effectiveConfig.stateAdapter,
  });
  const mediaResolvedProps = useRuntimeMediaProps({
    cache: mediaResolutionCache,
    mediaAssets: effectiveConfig.mediaAssets,
    props: bindingResolvedProps,
    resolveMediaAsset: effectiveConfig.resolveMediaAsset,
  });
  const resolvedProps = effectiveConfig.resolveNodeProps
    ? effectiveConfig.resolveNodeProps({ node, props: mediaResolvedProps })
    : mediaResolvedProps;

  if (!Component) {
    const diagnostic = getUnknownComponentDiagnostic(node.type, effectiveRegistry);
    return (
      <View style={styles.errorBox}>
        <Text style={styles.errorTitle}>{diagnostic.title}</Text>
        <Text style={styles.errorText}>{diagnostic.suggestion}</Text>
        <Text style={styles.errorMeta}>{diagnostic.detail}</Text>
      </View>
    );
  }

  const repeatItems =
    repeatSyncResult?.status === 'ready' ? repeatSyncResult.items : currentAsyncRepeatResult?.items;
  const shouldRenderRepeatEmptyState = shouldRenderRuntimeRepeatEmptyState({
    diagnostics: repeatDiagnostics,
    items: repeatItems,
    status:
      repeatSyncResult?.status === 'ready'
        ? 'ready'
        : repeatSyncResult?.status === 'pending'
          ? 'pending'
          : currentAsyncRepeatResult
            ? 'ready'
            : undefined,
  });
  const renderedChildren = node.repeat
    ? repeatItems && repeatItems.length > 0
      ? repeatItems.flatMap((item, itemIndex) =>
          (node.children ?? []).map((child) => {
            const itemAlias = node.repeat?.itemAlias ?? 'item';
            const repeatKey = resolveRuntimeRepeatItemKey({
              item,
              itemAlias,
              index: itemIndex,
              keyPath: node.repeat?.keyPath,
            });

            return (
              <RuntimeRenderer
                key={`${child.id}:${String(repeatKey)}`}
                node={child}
                registry={effectiveRegistry}
                bindingContext={createRuntimeRepeatBindingContext({
                  baseContext: effectiveConfig.bindingContext,
                  item,
                  itemAlias,
                })}
              />
            );
          }),
        )
      : shouldRenderRepeatEmptyState
        ? node.repeat.empty?.map((child) => (
            <RuntimeRenderer key={child.id} node={child} registry={effectiveRegistry} />
          ))
        : undefined
    : node.children?.map((child) => (
        <RuntimeRenderer key={child.id} node={child} registry={effectiveRegistry} />
      ));

  const propsWithActions = wrapRuntimeActionProps({
    props: resolvedProps,
    disableActions: effectiveConfig.disableActions === true,
    handleAction,
    actionHandlerCache,
    functionHandlerCache,
  });
  const propsWithEvents = wrapRuntimeEventProps({
    context: effectiveConfig.bindingContext,
    dataBindings: effectiveConfig.dataBindings,
    props: propsWithActions,
    disableActions: effectiveConfig.disableActions === true,
    dispatchComponentEvent: dispatchRuntimeEvent,
    node,
  });

  const componentChildren = resolveRenderedChildren({
    propChildren: propsWithEvents.children as React.ReactNode,
    renderedChildren,
  });

  let content: React.ReactNode = <Component {...propsWithEvents}>{componentChildren}</Component>;
  if (effectiveConfig.wrapNode) {
    content = effectiveConfig.wrapNode({ node, rendered: content, isRoot });
  }

  return (
    <RuntimeMediaResolutionCacheProvider value={mediaResolutionCache}>
      <RuntimeRendererConfigProvider value={explicitConfig}>
        {content}
      </RuntimeRendererConfigProvider>
    </RuntimeMediaResolutionCacheProvider>
  );
}

const styles = StyleSheet.create({
  errorBox: {
    borderColor: '#ef4444',
    borderRadius: 8,
    borderWidth: 1,
    margin: 8,
    padding: 8,
  },
  errorTitle: {
    color: '#991b1b',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  errorText: {
    color: '#ef4444',
    fontWeight: '600',
  },
  errorMeta: {
    color: '#7f1d1d',
    fontSize: 12,
    marginTop: 4,
  },
});
