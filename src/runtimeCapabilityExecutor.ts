import type {
  RuntimeCapabilityExecutionArgs,
  RuntimeCapabilityExecutionResult,
  RuntimeCapabilityExecutor,
} from './runtimeBindings';

export interface RuntimeCapabilityExecutorComposition {
  readonly apiCapabilityExecutor: RuntimeCapabilityExecutor;
  readonly capabilityExecutor?: RuntimeCapabilityExecutor;
}

/*** Routes manifest-owned API capabilities before delegating application-owned capabilities. */
export function composeRuntimeCapabilityExecutor(
  composition: RuntimeCapabilityExecutorComposition,
): RuntimeCapabilityExecutor {
  return async (args) =>
    args.capability.startsWith('api.')
      ? composition.apiCapabilityExecutor(args)
      : executeApplicationCapabilityAsync(args, composition.capabilityExecutor);
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
