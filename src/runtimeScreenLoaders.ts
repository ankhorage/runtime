import type {
  BindingValue,
  DataSourceDiagnostic,
  ScreenDataLoaderDefinition,
  ScreenSpec,
} from '@ankhorage/contracts';
import React from 'react';

import {
  executeRuntimeBindingInvocation,
  resolveBindingInputMapSync,
  type RuntimeBindingResultCache,
  type RuntimeBindingResultWriter,
  type RuntimeCapabilityExecutor,
} from './runtimeBindings';

export interface RuntimeScreenOperationLoaderState {
  readonly dependencyKey: string;
  readonly diagnostics: readonly DataSourceDiagnostic[];
  readonly resultSlots: RuntimeBindingResultCache;
  readonly renderVersion: number;
}

export interface RuntimeScreenOperationLoaderExecutionResult {
  readonly dependencyKey: string;
  readonly diagnostics: readonly DataSourceDiagnostic[];
  readonly resultSlots: RuntimeBindingResultCache;
}

interface RuntimeScreenOperationLoaderRequestLifecycle {
  invalidate(): void;
  start(dependencyKey: string): number | undefined;
  isCurrent(args: { readonly dependencyKey: string; readonly requestId: number }): boolean;
}

/*** Tracks one active screen-loader request per effective dependency key. */
export function createRuntimeScreenOperationLoaderRequestLifecycle(): RuntimeScreenOperationLoaderRequestLifecycle {
  let dependencyKey: string | undefined;
  let requestId = 0;

  return {
    invalidate() {
      requestId += 1;
    },
    start(nextDependencyKey) {
      if (nextDependencyKey === dependencyKey) return undefined;
      dependencyKey = nextDependencyKey;
      requestId += 1;
      return requestId;
    },
    isCurrent(args) {
      return args.dependencyKey === dependencyKey && args.requestId === requestId;
    },
  };
}

/*** Returns the portable capability invocations authored on a screen. */
export function resolveScreenOperationLoaders(
  screen: ScreenSpec,
): readonly ScreenDataLoaderDefinition[] {
  return screen.dataLoaders ?? [];
}

/*** Creates a deterministic loader request key from resolved inputs and declared result slots. */
export function createRuntimeScreenLoaderRequestKey(args: {
  readonly screenId: string;
  readonly loaders: readonly ScreenDataLoaderDefinition[];
  readonly bindingContext?: Record<string, unknown>;
  readonly resultSlots?: RuntimeBindingResultCache;
}): string {
  return stableSerialize({
    loaders: args.loaders.map((loader) => ({
      capability: loader.capability,
      input: resolveBindingInputMapSync(loader.input, {
        context: args.bindingContext,
        resultSlots: args.resultSlots,
      }),
      result: loader.result,
    })),
    screenId: args.screenId,
  });
}

/*** Constructs a pending state for capability-backed screen loaders. */
export function createPendingRuntimeScreenOperationLoaderState(args: {
  readonly dependencyKey: string;
  readonly previousState?: RuntimeScreenOperationLoaderState;
}): RuntimeScreenOperationLoaderState {
  return {
    dependencyKey: args.dependencyKey,
    diagnostics: [],
    resultSlots: {},
    renderVersion: (args.previousState?.renderVersion ?? -1) + 1,
  };
}

/*** Executes screen loaders through the same invocation and result-slot machinery as events. */
export async function executeRuntimeScreenOperationLoaders(args: {
  readonly bindingContext?: Record<string, unknown>;
  readonly executeCapability?: RuntimeCapabilityExecutor;
  readonly resultSlots?: RuntimeBindingResultCache;
  readonly screen: ScreenSpec;
  readonly loaders: readonly ScreenDataLoaderDefinition[];
}): Promise<RuntimeScreenOperationLoaderExecutionResult> {
  const resultSlots: Record<string, BindingValue | undefined> = { ...(args.resultSlots ?? {}) };
  const diagnostics: DataSourceDiagnostic[] = [];
  const writeResultSlot: RuntimeBindingResultWriter = (slot, value) => {
    resultSlots[slot] = value;
  };

  for (const loader of args.loaders) {
    try {
      await executeRuntimeBindingInvocation(
        loader,
        {
          context: args.bindingContext,
          executeCapability: args.executeCapability,
          resultSlots,
          writeResultSlot,
        },
        { node: args.screen.root },
        diagnostics,
      );
    } catch {
      diagnostics.push({
        code: 'adapter-error',
        message: `Capability '${loader.capability}' could not be completed. Please try again.`,
        severity: 'error',
      });
    }
  }

  return {
    dependencyKey: createRuntimeScreenLoaderRequestKey({
      bindingContext: args.bindingContext,
      loaders: args.loaders,
      resultSlots: args.resultSlots,
      screenId: args.screen.id,
    }),
    diagnostics,
    resultSlots,
  };
}

/*** Runs screen capability invocations when their serialized request input changes. */
export function useRuntimeScreenOperationLoaders(args: {
  readonly bindingContext?: Record<string, unknown>;
  readonly executeCapability?: RuntimeCapabilityExecutor;
  readonly resultSlots?: RuntimeBindingResultCache;
  readonly onDiagnostics?: (diagnostics: readonly DataSourceDiagnostic[]) => void;
  readonly screen: ScreenSpec;
}): RuntimeScreenOperationLoaderState {
  const { onDiagnostics } = args;
  const loaders = React.useMemo(() => resolveScreenOperationLoaders(args.screen), [args.screen]);
  const dependencyKey = React.useMemo(
    () =>
      createRuntimeScreenLoaderRequestKey({
        bindingContext: args.bindingContext,
        loaders,
        resultSlots: args.resultSlots,
        screenId: args.screen.id,
      }),
    [args.bindingContext, args.resultSlots, args.screen.id, loaders],
  );
  const [state, setState] = React.useState<RuntimeScreenOperationLoaderState>(() =>
    createPendingRuntimeScreenOperationLoaderState({ dependencyKey }),
  );
  const requestLifecycle = React.useRef(createRuntimeScreenOperationLoaderRequestLifecycle());

  React.useEffect(() => {
    if (loaders.length === 0) {
      requestLifecycle.current.invalidate();
      return;
    }
    const requestId = requestLifecycle.current.start(dependencyKey);
    if (requestId === undefined) return;
    void executeRuntimeScreenOperationLoaders({
      bindingContext: args.bindingContext,
      executeCapability: args.executeCapability,
      loaders,
      resultSlots: args.resultSlots,
      screen: args.screen,
    }).then((result) => {
      if (requestLifecycle.current.isCurrent({ dependencyKey, requestId })) {
        setState((current) => ({
          ...result,
          renderVersion:
            current.dependencyKey === dependencyKey
              ? current.renderVersion
              : current.renderVersion + 1,
        }));
      }
    });
  }, [
    args.bindingContext,
    args.executeCapability,
    args.resultSlots,
    args.screen,
    dependencyKey,
    loaders,
  ]);

  React.useEffect(
    () => () => {
      requestLifecycle.current.invalidate();
    },
    [],
  );

  React.useEffect(() => {
    if (state.diagnostics.length > 0) onDiagnostics?.(state.diagnostics);
  }, [onDiagnostics, state.diagnostics]);

  return state.dependencyKey === dependencyKey
    ? state
    : createPendingRuntimeScreenOperationLoaderState({ dependencyKey, previousState: state });
}

function stableSerialize(value: unknown): string {
  return JSON.stringify(value);
}
