import type { StateAdapter, StatePath, StateValue } from '@ankhorage/contracts';
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

/*** Routes API and state capabilities before delegating application-owned capabilities. */
export function composeRuntimeCapabilityExecutor(
  composition: RuntimeCapabilityExecutorComposition,
): RuntimeCapabilityExecutor {
  return async (args) =>
    args.capability.startsWith('api.')
      ? composition.apiCapabilityExecutor(args)
      : args.capability === 'state.set'
        ? executeStateSetCapabilityAsync(args, composition.stateAdapter)
        : executeApplicationCapabilityAsync(args, composition.capabilityExecutor);
}

/*** Applies one serializable state value through the configured application state adapter. */
function executeStateSetCapabilityAsync(
  args: RuntimeCapabilityExecutionArgs,
  stateAdapter: StateAdapter | undefined,
): Promise<RuntimeCapabilityExecutionResult> {
  if (stateAdapter === undefined) return Promise.resolve(missingStateAdapterResult());

  const input = resolveStateSetInput(args.input);
  if (input === undefined) return Promise.resolve(invalidStateSetInputResult());

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

function isStatePath(value: unknown): value is StatePath {
  return (
    (typeof value === 'string' && value.trim().length > 0) ||
    (Array.isArray(value) &&
      value.length > 0 &&
      value.every((part) => typeof part === 'string' && part.trim().length > 0))
  );
}

function isStateValue(value: unknown): value is StateValue {
  if (value === null || ['boolean', 'number', 'string'].includes(typeof value)) return true;
  if (Array.isArray(value)) return value.every(isStateValue);
  return isRecord(value) && Object.values(value).every(isStateValue);
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
