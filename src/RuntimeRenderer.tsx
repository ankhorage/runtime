import type {
  BindingValue,
  ComponentDataBindingRegistry,
  DataSourceDiagnostic,
  DataSourceRegistry,
  DbAdapter,
  DbRealtimeAdapter,
  StateAdapter,
  UiNode,
} from '@ankhorage/contracts';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { ComponentRegistry } from './registry';
import { ZORA_COMPONENT_REGISTRY } from './registry';
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
import { resolveRuntimeNodeProps, wrapRuntimeActionProps } from './runtimeNodeProps';
import {
  mergeRuntimeRendererConfig,
  type RuntimeActionExecutor,
  RuntimeRendererConfigProvider,
  type RuntimeRendererWrapArgs,
  useRuntimeRendererConfig,
} from './RuntimeRendererConfig';
import { dispatchRuntimeComponentEventWithReporting } from './runtimeEventExecution';
import {
  createRuntimeRepeatBindingContext,
  resolveRuntimeRepeatItemKey,
  resolveRuntimeRepeatItemsAsync,
  resolveRuntimeRepeatItemsSync,
} from './runtimeRepeat';
import { createRepeatDiagnosticsKey } from './runtimeRepeatDiagnostics';
import { shouldRenderRuntimeRepeatEmptyState } from './runtimeRepeatEmptyState';
import { createDbPersistActionHandler } from './runtimeDbPersist';
import type { RuntimeActionHandlerArgs } from './RuntimeRendererConfig';

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
  dataSources?: DataSourceRegistry;
  dataBindings?: ComponentDataBindingRegistry;
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
    dataSources,
    dataBindings,
    operationResults,
    executeAction,
    executeOperation,
    onDiagnostics,
  } = props;
  const inheritedConfig = useRuntimeRendererConfig();
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
  const actionHandlerCacheRef = React.useRef(new WeakMap<object, (...args: unknown[]) => void>());
  const functionHandlerCacheRef = React.useRef(
    new WeakMap<(...args: unknown[]) => unknown, (...args: unknown[]) => unknown>(),
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
      bindingContext,
      dataBindings,
      dataSources,
      dbAdapter,
      dbRealtimeAdapter,
      disableActions,
      executeAction,
      executeOperation,
      operationResults: effectiveOperationResults,
      onDiagnostics,
      registry,
      stateAdapter,
      wrapNode,
      writeOperationResult: inheritedConfig.writeOperationResult ?? writeLocalOperationResult,
    }),
    [
      bindingContext,
      dataBindings,
      dataSources,
      dbAdapter,
      dbRealtimeAdapter,
      disableActions,
      executeAction,
      effectiveOperationResults,
      executeOperation,
      inheritedConfig.writeOperationResult,
      onDiagnostics,
      registry,
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
    [effectiveActionHandlers, effectiveConfig.executeAction],
  );
  const dispatchRuntimeEvent = React.useCallback(
    async (eventArgs: RuntimeComponentEventDispatchArgs) => {
      await dispatchRuntimeComponentEventWithReporting({
        ...eventArgs,
        actionHandlers: effectiveActionHandlers,
        dataBindings: eventArgs.dataBindings ?? effectiveConfig.dataBindings,
        dataSources: eventArgs.dataSources ?? effectiveConfig.dataSources,
        executeAction: effectiveConfig.executeAction ?? executeRuntimeAction,
        executeOperation: eventArgs.executeOperation ?? effectiveConfig.executeOperation,
        onDiagnostics: effectiveConfig.onDiagnostics,
        operationResults: eventArgs.operationResults ?? effectiveConfig.operationResults,
        writeOperationResult:
          eventArgs.writeOperationResult ?? effectiveConfig.writeOperationResult,
      });
    },
    [
      effectiveActionHandlers,
      effectiveConfig.dataBindings,
      effectiveConfig.dataSources,
      effectiveConfig.executeAction,
      effectiveConfig.executeOperation,
      effectiveConfig.onDiagnostics,
      effectiveConfig.operationResults,
      effectiveConfig.writeOperationResult,
      executeRuntimeAction,
    ],
  );
  const executeRuntimeActionRef = React.useRef(executeRuntimeAction);
  const dispatchRuntimeEventRef = React.useRef(dispatchRuntimeEvent);
  const effectiveRegistry = React.useMemo(
    () =>
      resolveRuntimeRegistry({
        propRegistry: registry,
        configRegistry: effectiveConfig.registry,
        fallbackRegistry: ZORA_COMPONENT_REGISTRY,
      }),
    [effectiveConfig.registry, registry],
  );
  const Component = effectiveRegistry[node.type];

  React.useEffect(() => {
    executeRuntimeActionRef.current = executeRuntimeAction;
  }, [executeRuntimeAction]);

  React.useEffect(() => {
    dispatchRuntimeEventRef.current = dispatchRuntimeEvent;
  }, [dispatchRuntimeEvent]);

  const repeatSyncResult = React.useMemo(() => {
    const { repeat } = node;
    if (!repeat) {
      return null;
    }

    return resolveRuntimeRepeatItemsSync(repeat, {
      context: effectiveConfig.bindingContext,
      dataBindings: effectiveConfig.dataBindings,
      dataSources: effectiveConfig.dataSources,
      executeOperation: effectiveConfig.executeOperation,
      node,
      operationResults: effectiveConfig.operationResults,
      stateAdapter: effectiveConfig.stateAdapter,
      writeOperationResult: effectiveConfig.writeOperationResult,
    });
  }, [
    effectiveConfig.bindingContext,
    effectiveConfig.dataBindings,
    effectiveConfig.dataSources,
    effectiveConfig.executeOperation,
    effectiveConfig.operationResults,
    effectiveConfig.stateAdapter,
    effectiveConfig.writeOperationResult,
    node,
  ]);
  const [asyncRepeatResult, setAsyncRepeatResult] = React.useState<{
    readonly items: readonly BindingValue[];
    readonly diagnostics: readonly DataSourceDiagnostic[];
  } | null>(null);
  const repeatRequestIdRef = React.useRef(0);
  const lastRepeatDiagnosticsKeyRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    repeatRequestIdRef.current += 1;
    const requestId = repeatRequestIdRef.current;
    const { repeat } = node;

    if (!repeat || repeatSyncResult?.status !== 'pending') {
      setAsyncRepeatResult(null);
      return undefined;
    }

    void (async () => {
      const result = await resolveRuntimeRepeatItemsAsync(repeat, {
        context: effectiveConfig.bindingContext,
        dataBindings: effectiveConfig.dataBindings,
        dataSources: effectiveConfig.dataSources,
        executeOperation: effectiveConfig.executeOperation,
        node,
        operationResults: effectiveConfig.operationResults,
        stateAdapter: effectiveConfig.stateAdapter,
        writeOperationResult: effectiveConfig.writeOperationResult,
      });

      if (repeatRequestIdRef.current !== requestId) {
        return;
      }

      setAsyncRepeatResult(result);
    })();

    return () => {
      repeatRequestIdRef.current += 1;
    };
  }, [
    effectiveConfig.bindingContext,
    effectiveConfig.dataBindings,
    effectiveConfig.dataSources,
    effectiveConfig.executeOperation,
    effectiveConfig.operationResults,
    effectiveConfig.stateAdapter,
    effectiveConfig.writeOperationResult,
    node,
    repeatSyncResult,
  ]);
  const repeatDiagnostics =
    repeatSyncResult?.status === 'ready'
      ? repeatSyncResult.diagnostics
      : asyncRepeatResult?.diagnostics;

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
  }, [effectiveConfig.onDiagnostics, node.repeat, repeatDiagnostics]);

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
    repeatSyncResult?.status === 'ready' ? repeatSyncResult.items : asyncRepeatResult?.items;
  const shouldRenderRepeatEmptyState = shouldRenderRuntimeRepeatEmptyState({
    diagnostics: repeatDiagnostics,
    items: repeatItems,
    status:
      repeatSyncResult?.status === 'ready'
        ? 'ready'
        : repeatSyncResult?.status === 'pending'
          ? 'pending'
          : asyncRepeatResult
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

  const resolvedProps = resolveRuntimeNodeProps({
    bindingContext: effectiveConfig.bindingContext,
    dataBindings: effectiveConfig.dataBindings,
    dataSources: effectiveConfig.dataSources,
    dbAdapter: effectiveConfig.dbAdapter,
    dbRealtimeAdapter: effectiveConfig.dbRealtimeAdapter,
    node,
    operationResults: effectiveConfig.operationResults,
    resolveNodeProps: effectiveConfig.resolveNodeProps,
    stateAdapter: effectiveConfig.stateAdapter,
  });
  const propsWithActions = wrapRuntimeActionProps({
    props: resolvedProps,
    disableActions: effectiveConfig.disableActions === true,
    handleAction: (action) => {
      void executeRuntimeActionRef.current({ action });
    },
    actionHandlerCache: actionHandlerCacheRef.current,
    functionHandlerCache: functionHandlerCacheRef.current,
  });
  const propsWithEvents = wrapRuntimeEventProps({
    context: effectiveConfig.bindingContext,
    dataBindings: effectiveConfig.dataBindings,
    props: propsWithActions,
    disableActions: effectiveConfig.disableActions === true,
    dispatchComponentEvent: (eventArgs) => dispatchRuntimeEventRef.current(eventArgs),
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
    <RuntimeRendererConfigProvider value={explicitConfig}>{content}</RuntimeRendererConfigProvider>
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
