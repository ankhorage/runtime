import type { DataSourceDiagnostic } from '@ankhorage/contracts';
import type { Capability } from '@ankhorage/contracts/capability';
import { isRecord } from '@ankhorage/utility/object';

export type RuntimeEventOperationStatus = 'idle' | 'loading' | 'success' | 'error';

export interface RuntimeEventOperationState {
  readonly status: RuntimeEventOperationStatus;
  readonly loading: boolean;
  readonly errorMessage: string;
  readonly nodeId?: string;
  readonly capability?: Capability['id'];
}

export interface RuntimeEventOperationInvocation {
  readonly id: number;
}

export interface RuntimeEventOperationLifecycle {
  start(args: {
    readonly nodeId: string;
    readonly capability: Capability['id'];
  }): RuntimeEventOperationInvocation | undefined;
  succeed(invocation: RuntimeEventOperationInvocation): void;
  fail(invocation: RuntimeEventOperationInvocation, message: string): void;
}

export const IDLE_RUNTIME_EVENT_OPERATION_STATE: RuntimeEventOperationState = {
  status: 'idle',
  loading: false,
  errorMessage: '',
};

/**
 * Creates a single-flight lifecycle controller for component-triggered API operations.
 *
 * @param onStateChange - Receives bindable lifecycle snapshots.
 * @returns A controller that rejects concurrent starts and ignores stale completions.
 */
export function createRuntimeEventOperationLifecycle(
  onStateChange: (state: RuntimeEventOperationState) => void,
): RuntimeEventOperationLifecycle {
  let nextInvocationId = 0;
  let activeInvocationId: number | undefined;
  let activeCapability: Capability['id'] | undefined;
  let activeNodeId: string | undefined;

  const finish = (
    invocation: RuntimeEventOperationInvocation,
    status: Extract<RuntimeEventOperationStatus, 'success' | 'error'>,
    errorMessage: string,
  ) => {
    if (activeInvocationId !== invocation.id) return;

    onStateChange({
      status,
      loading: false,
      errorMessage,
      nodeId: activeNodeId,
      capability: activeCapability,
    });
    activeInvocationId = undefined;
  };

  return {
    start({ capability, nodeId }) {
      if (activeInvocationId !== undefined) return undefined;

      nextInvocationId += 1;
      activeInvocationId = nextInvocationId;
      activeNodeId = nodeId;
      activeCapability = capability;
      onStateChange({ status: 'loading', loading: true, errorMessage: '', nodeId, capability });

      return { id: activeInvocationId };
    },
    succeed(invocation) {
      finish(invocation, 'success', '');
    },
    fail(invocation, message) {
      finish(invocation, 'error', message);
    },
  };
}

/**
 * Adds the public Runtime event-operation namespace without replacing caller context.
 *
 * @param context - Existing manifest binding context.
 * @param state - Current event-operation lifecycle snapshot.
 * @returns Context exposing `runtime.eventOperation` for ordinary context bindings.
 */
export function createRuntimeEventOperationBindingContext(
  context: Record<string, unknown> | undefined,
  state: RuntimeEventOperationState,
): Record<string, unknown> {
  const runtime = isRecord(context?.runtime) ? context.runtime : {};

  return {
    ...(context ?? {}),
    runtime: {
      ...runtime,
      eventOperation: state,
    },
  };
}

/**
 * Selects a stable, human-readable error for inline presentation.
 *
 * @param diagnostics - Diagnostics produced while resolving or executing the operation.
 * @returns The first error message, or a safe generic fallback.
 */
export function resolveRuntimeEventOperationErrorMessage(
  diagnostics: readonly DataSourceDiagnostic[],
): string {
  return (
    diagnostics.find((diagnostic) => diagnostic.severity === 'error')?.message ??
    'The operation could not be completed. Please try again.'
  );
}
