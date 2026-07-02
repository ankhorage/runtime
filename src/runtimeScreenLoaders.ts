import type {
  ApiScreenDataLoaderDefinition,
  BindingValue,
  DataSourceDiagnostic,
  OperationScreenDataLoaderDefinition,
  ScreenSpec,
} from '@ankhorage/contracts';
import React from 'react';

import {
  createRuntimeBindingOperationKey,
  resolveBindingInputMapSync,
  resolveRuntimeBindingOperationSelection,
  type RuntimeBindingOperationExecutor,
  type RuntimeBindingOperationResultCache,
  type RuntimeBindingResolutionContext,
} from './runtimeBindings';

export interface RuntimeScreenOperationLoaderState {
  readonly dependencyKey: string;
  readonly diagnostics: readonly DataSourceDiagnostic[];
  readonly operationResults: RuntimeBindingOperationResultCache;
  readonly renderVersion: number;
}

export interface RuntimeScreenOperationLoaderExecutionResult {
  readonly dependencyKey: string;
  readonly diagnostics: readonly DataSourceDiagnostic[];
  readonly operationResults: RuntimeBindingOperationResultCache;
}

export interface RuntimeScreenOperationLoaderLifecycle {
  readonly activeRequestId: number;
  readonly activeRequestKey: string | null;
}

const EMPTY_RUNTIME_SCREEN_OPERATION_LOADER_DIAGNOSTICS = Object.freeze(
  [],
) as readonly DataSourceDiagnostic[];
const EMPTY_RUNTIME_SCREEN_OPERATION_RESULTS = Object.freeze(
  {},
) as RuntimeBindingOperationResultCache;

export function resolveScreenApiLoaders(
  screen: ScreenSpec,
): readonly ApiScreenDataLoaderDefinition[] {
  return (screen.dataLoaders ?? []).filter(
    (loader): loader is ApiScreenDataLoaderDefinition => loader.kind === 'api',
  );
}

export function resolveScreenOperationLoaders(
  screen: ScreenSpec,
): readonly OperationScreenDataLoaderDefinition[] {
  return (screen.dataLoaders ?? []).filter(
    (loader): loader is OperationScreenDataLoaderDefinition => loader.kind === 'operation',
  );
}

export function createRuntimeScreenLoaderRequestKey(args: {
  readonly screenId: string;
  readonly loaders: readonly OperationScreenDataLoaderDefinition[];
  readonly bindingContext?: Record<string, unknown>;
  readonly operationResults?: RuntimeBindingOperationResultCache;
}): string {
  return createRuntimeScreenOperationLoaderPlan({
    bindingContext: args.bindingContext,
    loaders: args.loaders,
    operationResults: args.operationResults,
    screenId: args.screenId,
  }).requestKey;
}

export function createRuntimeScreenOperationLoaderLifecycle(): RuntimeScreenOperationLoaderLifecycle {
  return {
    activeRequestId: 0,
    activeRequestKey: null,
  };
}

export function createIdleRuntimeScreenOperationLoaderState(args: {
  readonly dependencyKey: string;
  readonly previousState?: RuntimeScreenOperationLoaderState;
}): RuntimeScreenOperationLoaderState {
  return {
    dependencyKey: args.dependencyKey,
    diagnostics: EMPTY_RUNTIME_SCREEN_OPERATION_LOADER_DIAGNOSTICS,
    operationResults: EMPTY_RUNTIME_SCREEN_OPERATION_RESULTS,
    renderVersion: args.previousState?.renderVersion ?? 0,
  };
}

export function createPendingRuntimeScreenOperationLoaderState(args: {
  readonly dependencyKey: string;
  readonly previousState?: RuntimeScreenOperationLoaderState;
}): RuntimeScreenOperationLoaderState {
  return {
    dependencyKey: args.dependencyKey,
    diagnostics: [],
    operationResults: {},
    renderVersion: (args.previousState?.renderVersion ?? -1) + 1,
  };
}

export function beginRuntimeScreenOperationLoaderRequest(args: {
  readonly hasLoaders: boolean;
  readonly lifecycle: RuntimeScreenOperationLoaderLifecycle;
  readonly requestKey: string;
  readonly state: RuntimeScreenOperationLoaderState;
}): {
  readonly lifecycle: RuntimeScreenOperationLoaderLifecycle;
  readonly requestId?: number;
  readonly shouldExecute: boolean;
  readonly state: RuntimeScreenOperationLoaderState;
} {
  if (!args.hasLoaders) {
    if (args.lifecycle.activeRequestKey === null) {
      return {
        lifecycle: args.lifecycle,
        shouldExecute: false,
        state: args.state,
      };
    }

    return {
      lifecycle: {
        activeRequestId: args.lifecycle.activeRequestId + 1,
        activeRequestKey: null,
      },
      shouldExecute: false,
      state: args.state,
    };
  }

  if (args.lifecycle.activeRequestKey === args.requestKey) {
    return {
      lifecycle: args.lifecycle,
      shouldExecute: false,
      state: args.state,
    };
  }

  const requestId = args.lifecycle.activeRequestId + 1;

  return {
    lifecycle: {
      activeRequestId: requestId,
      activeRequestKey: args.requestKey,
    },
    requestId,
    shouldExecute: true,
    state:
      args.state.dependencyKey === args.requestKey
        ? args.state
        : createPendingRuntimeScreenOperationLoaderState({
            dependencyKey: args.requestKey,
            previousState: args.state,
          }),
  };
}

export function completeRuntimeScreenOperationLoaderRequest(args: {
  readonly lifecycle: RuntimeScreenOperationLoaderLifecycle;
  readonly requestId: number;
  readonly result: RuntimeScreenOperationLoaderExecutionResult;
  readonly state: RuntimeScreenOperationLoaderState;
}): {
  readonly accepted: boolean;
  readonly state: RuntimeScreenOperationLoaderState;
} {
  if (args.lifecycle.activeRequestId !== args.requestId) {
    return {
      accepted: false,
      state: args.state,
    };
  }

  return {
    accepted: true,
    state: {
      dependencyKey: args.result.dependencyKey,
      diagnostics: args.result.diagnostics,
      operationResults: args.result.operationResults,
      renderVersion: args.state.renderVersion,
    },
  };
}

export async function executeRuntimeScreenOperationLoaders(args: {
  readonly bindingContext?: Record<string, unknown>;
  readonly dataSources?: RuntimeBindingResolutionContext['dataSources'];
  readonly executeOperation?: RuntimeBindingOperationExecutor;
  readonly operationResults?: RuntimeBindingOperationResultCache;
  readonly screen: ScreenSpec;
  readonly loaders: readonly OperationScreenDataLoaderDefinition[];
}): Promise<RuntimeScreenOperationLoaderExecutionResult> {
  const plan = createRuntimeScreenOperationLoaderPlan({
    bindingContext: args.bindingContext,
    loaders: args.loaders,
    operationResults: args.operationResults,
    screenId: args.screen.id,
  });

  return executePreparedRuntimeScreenOperationLoaders({
    dataSources: args.dataSources,
    executeOperation: args.executeOperation,
    plan,
    screen: args.screen,
  });
}

function executePreparedRuntimeScreenOperationLoaders(args: {
  readonly dataSources?: RuntimeBindingResolutionContext['dataSources'];
  readonly executeOperation?: RuntimeBindingOperationExecutor;
  readonly plan: RuntimeScreenOperationLoaderPlan;
  readonly screen: ScreenSpec;
}): Promise<RuntimeScreenOperationLoaderExecutionResult> {
  const diagnostics: DataSourceDiagnostic[] = [...args.plan.diagnostics];

  if (args.plan.loaders.length === 0) {
    return Promise.resolve({
      dependencyKey: args.plan.requestKey,
      diagnostics,
      operationResults: {},
    });
  }

  if (args.executeOperation === undefined) {
    diagnostics.push(
      ...args.plan.loaders.map((preparedLoader) =>
        createScreenOperationLoaderDiagnostic(
          preparedLoader.loader,
          'missing-adapter',
          'Screen operation loader requires an injected operation executor.',
        ),
      ),
    );

    return Promise.resolve({
      dependencyKey: args.plan.requestKey,
      diagnostics,
      operationResults: {},
    });
  }
  const { executeOperation } = args;

  return (async () => {
    const operationResults: Record<string, BindingValue | undefined> = {};

    for (const preparedLoader of args.plan.loaders) {
      const selection = resolveRuntimeBindingOperationSelection(
        preparedLoader.loader.operation,
        args.dataSources,
        diagnostics,
      );
      if (selection === undefined) {
        continue;
      }

      const result = await executeOperation({
        dataSource: selection.dataSource,
        endpoint: selection.endpoint,
        input: preparedLoader.input,
        node: args.screen.root,
        operation: preparedLoader.loader.operation,
      });
      diagnostics.push(...(result.diagnostics ?? []));

      if (!result.ok) {
        continue;
      }

      operationResults[preparedLoader.operationKey] = result.data;
    }

    return {
      dependencyKey: args.plan.requestKey,
      diagnostics,
      operationResults,
    };
  })();
}

export function useRuntimeScreenOperationLoaders(args: {
  readonly bindingContext?: Record<string, unknown>;
  readonly dataSources?: RuntimeBindingResolutionContext['dataSources'];
  readonly executeOperation?: RuntimeBindingOperationExecutor;
  readonly operationResults?: RuntimeBindingOperationResultCache;
  readonly onDiagnostics?: (diagnostics: readonly DataSourceDiagnostic[]) => void;
  readonly screen: ScreenSpec;
}): RuntimeScreenOperationLoaderState {
  const loaders = React.useMemo(() => resolveScreenOperationLoaders(args.screen), [args.screen]);
  const hasLoaders = loaders.length > 0;
  const plan = React.useMemo(
    () =>
      createRuntimeScreenOperationLoaderPlan({
        bindingContext: args.bindingContext,
        loaders,
        operationResults: args.operationResults,
        screenId: args.screen.id,
      }),
    [args.bindingContext, args.operationResults, args.screen.id, loaders],
  );
  const { requestKey } = plan;
  const emptyState = React.useMemo(
    () =>
      createIdleRuntimeScreenOperationLoaderState({
        dependencyKey: requestKey,
      }),
    [requestKey],
  );
  const [state, setState] = React.useState<RuntimeScreenOperationLoaderState>(() =>
    hasLoaders
      ? createPendingRuntimeScreenOperationLoaderState({ dependencyKey: requestKey })
      : emptyState,
  );
  const effectiveState = hasLoaders ? state : emptyState;
  const lastDiagnosticsKeyRef = React.useRef<string | null>(null);
  const latestStateRef = React.useRef(state);
  const lifecycleRef = React.useRef<RuntimeScreenOperationLoaderLifecycle>(
    createRuntimeScreenOperationLoaderLifecycle(),
  );
  const executionArgsByRequestKeyRef = React.useRef<
    Record<string, RuntimeScreenPreparedExecutionArgs>
  >({});

  executionArgsByRequestKeyRef.current[requestKey] = {
    dataSources: args.dataSources,
    executeOperation: args.executeOperation,
    plan,
    screen: args.screen,
  };
  latestStateRef.current = state;

  React.useEffect(() => {
    const request = beginRuntimeScreenOperationLoaderRequest({
      hasLoaders,
      lifecycle: lifecycleRef.current,
      requestKey,
      state: latestStateRef.current,
    });

    lifecycleRef.current = request.lifecycle;

    if (request.state !== latestStateRef.current) {
      setState(request.state);
    }

    if (!request.shouldExecute || request.requestId === undefined) {
      return;
    }
    const { requestId } = request;

    void (async () => {
      const executionArgs = executionArgsByRequestKeyRef.current[requestKey];
      if (executionArgs === undefined) {
        return;
      }

      const result = await executePreparedRuntimeScreenOperationLoaders(executionArgs);

      setState((currentState) => {
        const completion = completeRuntimeScreenOperationLoaderRequest({
          lifecycle: lifecycleRef.current,
          requestId,
          result,
          state: currentState,
        });

        return completion.accepted ? completion.state : currentState;
      });
    })();
  }, [hasLoaders, requestKey]);

  React.useEffect(() => {
    if (effectiveState.diagnostics.length === 0) {
      return;
    }

    const diagnosticsKey = stableSerialize(effectiveState.diagnostics);
    if (lastDiagnosticsKeyRef.current === diagnosticsKey) {
      return;
    }

    lastDiagnosticsKeyRef.current = diagnosticsKey;
    args.onDiagnostics?.(effectiveState.diagnostics);
  }, [args.onDiagnostics, effectiveState.diagnostics]);

  return effectiveState;
}

interface PreparedRuntimeScreenOperationLoader {
  readonly input?: BindingValue;
  readonly loader: OperationScreenDataLoaderDefinition;
  readonly operationKey: string;
}

interface RuntimeScreenOperationLoaderPlan {
  readonly diagnostics: readonly DataSourceDiagnostic[];
  readonly loaders: readonly PreparedRuntimeScreenOperationLoader[];
  readonly requestKey: string;
}

interface RuntimeScreenPreparedExecutionArgs {
  readonly dataSources?: RuntimeBindingResolutionContext['dataSources'];
  readonly executeOperation?: RuntimeBindingOperationExecutor;
  readonly plan: RuntimeScreenOperationLoaderPlan;
  readonly screen: ScreenSpec;
}

function createRuntimeScreenOperationLoaderPlan(args: {
  readonly bindingContext?: Record<string, unknown>;
  readonly loaders: readonly OperationScreenDataLoaderDefinition[];
  readonly operationResults?: RuntimeBindingOperationResultCache;
  readonly screenId: string;
}): RuntimeScreenOperationLoaderPlan {
  if (args.loaders.length === 0) {
    return {
      diagnostics: EMPTY_RUNTIME_SCREEN_OPERATION_LOADER_DIAGNOSTICS,
      loaders: [],
      requestKey: createRuntimeScreenOperationLoaderIdleKey(args.screenId),
    };
  }

  const diagnostics: DataSourceDiagnostic[] = [];
  const preparedLoaders: PreparedRuntimeScreenOperationLoader[] = [];
  const operationKeys = new Set<string>();

  for (const loader of args.loaders) {
    const input = resolveBindingInputMapSync(
      loader.input,
      {
        context: args.bindingContext,
        operationResults: args.operationResults,
      },
      diagnostics,
    );
    const operationKey = createRuntimeBindingOperationKey(loader.operation);
    if (operationKeys.has(operationKey)) {
      diagnostics.push(
        createScreenOperationLoaderDiagnostic(
          loader,
          'duplicate-operation-id',
          `Screen operation loaders must not reuse operation key '${operationKey}' on the same screen.`,
        ),
      );
      continue;
    }

    operationKeys.add(operationKey);
    preparedLoaders.push({
      input,
      loader,
      operationKey,
    });
  }

  return {
    diagnostics,
    loaders: preparedLoaders,
    requestKey: createRuntimeScreenOperationLoaderPlanRequestKey({
      loaders: preparedLoaders,
      screenId: args.screenId,
    }),
  };
}

function createRuntimeScreenOperationLoaderPlanRequestKey(args: {
  readonly loaders: readonly PreparedRuntimeScreenOperationLoader[];
  readonly screenId: string;
}): string {
  return stableSerialize({
    loaders: args.loaders.map((loader) => ({
      id: loader.loader.id,
      input: loader.input,
      operation: loader.loader.operation,
      operationKey: loader.operationKey,
    })),
    screenId: args.screenId,
  });
}

function createScreenOperationLoaderDiagnostic(
  loader: OperationScreenDataLoaderDefinition,
  code: DataSourceDiagnostic['code'],
  message: string,
): DataSourceDiagnostic {
  return {
    code,
    dataSourceId: loader.operation.dataSourceId,
    endpointId: loader.operation.endpointId,
    operationId: loader.operation.operationId,
    message,
    severity: 'error',
  };
}

function createRuntimeScreenOperationLoaderIdleKey(screenId: string): string {
  return `screen:${screenId}:no-operation-loaders`;
}

function stableSerialize(value: unknown): string {
  return JSON.stringify(sortSerializableValue(value));
}

function sortSerializableValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortSerializableValue);
  }

  if (typeof value !== 'object' || value === null) {
    return value;
  }

  return Object.keys(value)
    .sort((left, right) => left.localeCompare(right))
    .reduce<Record<string, unknown>>((result, key) => {
      result[key] = sortSerializableValue((value as Record<string, unknown>)[key]);
      return result;
    }, {});
}
