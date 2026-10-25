import type { StateAdapter, StatePath, StateUpdate, StateValue } from '@ankhorage/contracts';
import { isRecord } from '@ankhorage/utility/object';

import type {
  RuntimeCapabilityExecutionArgs,
  RuntimeCapabilityExecutionResult,
  RuntimeCapabilityExecutor,
} from './runtimeBindings';

export interface RuntimeCapabilityExecutorComposition {
  readonly apiCapabilityExecutor: RuntimeCapabilityExecutor;
  readonly capabilityExecutor?: RuntimeCapabilityExecutor;
  readonly stateAdapter?: StateAdapter;
}

/*** Keeps local state mutations while preferring the configured host executor for API capabilities. */
export function composeRuntimeCapabilityExecutor(
  composition: RuntimeCapabilityExecutorComposition,
): RuntimeCapabilityExecutor {
  return async (args) =>
    args.capability.startsWith('api.')
      ? executeApiCapabilityAsync(args, composition)
      : args.capability === 'state.set'
        ? executeStateSetCapabilityAsync(args, composition.stateAdapter)
        : args.capability === 'state.update'
          ? executeStateUpdateCapabilityAsync(args, composition.stateAdapter)
          : executeApplicationCapabilityAsync(args, composition.capabilityExecutor);
}

/*** Uses the host API executor when supplied, falling back to the manifest executor. */
function executeApiCapabilityAsync(
  args: RuntimeCapabilityExecutionArgs,
  composition: RuntimeCapabilityExecutorComposition,
): Promise<RuntimeCapabilityExecutionResult> {
  return composition.capabilityExecutor?.(args) ?? composition.apiCapabilityExecutor(args);
}

/*** Applies one serializable state value through the configured application state adapter. */
function executeStateSetCapabilityAsync(
  args: RuntimeCapabilityExecutionArgs,
  stateAdapter: StateAdapter | undefined,
): Promise<RuntimeCapabilityExecutionResult> {
  if (stateAdapter === undefined) return Promise.resolve(missingStateAdapterResult());

  const input = resolveStateSetInput(args.input);
  if (input === undefined) return Promise.resolve(invalidStateSetInputResult());

  try {
    const result = stateAdapter.set(input.path, input.value);
    return Promise.resolve(
      result.ok
        ? { data: { path: input.path, value: input.value }, ok: true }
        : {
            diagnostics: [
              {
                code: result.error.code,
                message: result.error.message,
                severity: 'error',
              },
            ],
            ok: false,
          },
    );
  } catch (error) {
    return Promise.resolve(stateAdapterSetErrorResult(error));
  }
}

/*** Applies a serializable atomic state update through the configured state adapter. */
function executeStateUpdateCapabilityAsync(
  args: RuntimeCapabilityExecutionArgs,
  stateAdapter: StateAdapter | undefined,
): Promise<RuntimeCapabilityExecutionResult> {
  if (stateAdapter?.update === undefined) return Promise.resolve(missingStateUpdateAdapterResult());

  const input = resolveStateUpdateInput(args.input);
  if (input === undefined) return Promise.resolve(invalidStateUpdateInputResult());

  try {
    const result = stateAdapter.update(input.path, input.update);
    return Promise.resolve(
      result.ok
        ? { data: { path: input.path, value: result.data }, ok: true }
        : {
            diagnostics: [
              { code: result.error.code, message: result.error.message, severity: 'error' },
            ],
            ok: false,
          },
    );
  } catch (error) {
    return Promise.resolve(stateAdapterUpdateErrorResult(error));
  }
}

async function executeApplicationCapabilityAsync(
  args: RuntimeCapabilityExecutionArgs,
  capabilityExecutor: RuntimeCapabilityExecutor | undefined,
): Promise<RuntimeCapabilityExecutionResult> {
  if (capabilityExecutor !== undefined) return capabilityExecutor(args);
  return {
    diagnostics: [
      {
        code: 'missing-operation',
        message: `Capability '${args.capability}' has no configured executor.`,
        severity: 'error',
      },
    ],
    ok: false,
  };
}

function resolveStateSetInput(
  input: RuntimeCapabilityExecutionArgs['input'],
): { readonly path: StatePath; readonly value: StateValue } | undefined {
  if (!isRecord(input) || !('value' in input)) return undefined;
  const { path, value } = input;
  if (!isStatePath(path) || !isStateValue(value)) return undefined;
  return { path, value };
}

/*** Validates a portable append update before it reaches the StateAdapter boundary. */
function resolveStateUpdateInput(
  input: RuntimeCapabilityExecutionArgs['input'],
): { readonly path: StatePath; readonly update: StateUpdate } | undefined {
  if (!isRecord(input)) return undefined;
  const { path, update } = input;
  if (!isStatePath(path) || !isStateUpdate(update)) return undefined;
  return { path, update };
}

/*** Narrows unknown manifest input to the released serializable append descriptor. */
function isStateUpdate(value: unknown): value is StateUpdate {
  return isRecord(value) && value.kind === 'append' && isStateValue(value.value);
}

function isStatePath(value: unknown): value is StatePath {
  return (
    (typeof value === 'string' && value.trim().length > 0) ||
    (Array.isArray(value) &&
      value.length > 0 &&
      value.every((part) => typeof part === 'string' && part.trim().length > 0))
  );
}

function isStateValue(value: unknown): value is StateValue {
  if (value === null || typeof value === 'boolean' || typeof value === 'string') return true;
  if (typeof value === 'number') return Number.isFinite(value);
  if (Array.isArray(value)) return value.every(isStateValue);
  return isRecord(value) && Object.values(value).every(isStateValue);
}

/*** Converts thrown adapter failures into capability diagnostics at the public Runtime boundary. */
function stateAdapterSetErrorResult(error: unknown): RuntimeCapabilityExecutionResult {
  return {
    diagnostics: [
      {
        code: 'state-adapter-error',
        message: error instanceof Error ? error.message : 'StateAdapter.set failed.',
        severity: 'error',
      },
    ],
    ok: false,
  };
}

/*** Converts thrown state-update adapter failures into public Runtime diagnostics. */
function stateAdapterUpdateErrorResult(error: unknown): RuntimeCapabilityExecutionResult {
  return {
    diagnostics: [
      {
        code: 'state-adapter-error',
        message: error instanceof Error ? error.message : 'StateAdapter.update failed.',
        severity: 'error',
      },
    ],
    ok: false,
  };
}

function missingStateAdapterResult(): RuntimeCapabilityExecutionResult {
  return {
    diagnostics: [
      {
        code: 'missing-adapter',
        message: "Capability 'state.set' requires a configured StateAdapter.",
        severity: 'error',
      },
    ],
    ok: false,
  };
}

function invalidStateSetInputResult(): RuntimeCapabilityExecutionResult {
  return {
    diagnostics: [
      {
        code: 'invalid-input',
        message: "Capability 'state.set' requires a non-empty path and serializable value.",
        severity: 'error',
      },
    ],
    ok: false,
  };
}

/*** Reports an unavailable atomic-update adapter without delegating application execution. */
function missingStateUpdateAdapterResult(): RuntimeCapabilityExecutionResult {
  return {
    diagnostics: [
      {
        code: 'missing-adapter',
        message:
          "Capability 'state.update' requires a configured StateAdapter with update support.",
        severity: 'error',
      },
    ],
    ok: false,
  };
}

/*** Reports malformed state-update descriptors at the Runtime capability boundary. */
function invalidStateUpdateInputResult(): RuntimeCapabilityExecutionResult {
  return {
    diagnostics: [
      {
        code: 'invalid-input',
        message:
          "Capability 'state.update' requires a non-empty path and serializable append update.",
        severity: 'error',
      },
    ],
    ok: false,
  };
}
