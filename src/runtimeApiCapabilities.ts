import type {
  ApiDefinitionRegistry,
  BindingValue,
  DataSourceDiagnostic,
} from '@ankhorage/contracts';
import type { EndpointTestCredentialResolver, EndpointTestFetch } from '@ankhorage/data-sources';
import { testEndpoint } from '@ankhorage/data-sources';
import { isRecord } from '@ankhorage/utility/object';

import type {
  RuntimeCapabilityExecutionArgs,
  RuntimeCapabilityExecutionResult,
  RuntimeCapabilityExecutor,
} from './runtimeBindings';

export interface RuntimeApiCapabilityExecutorOptions {
  readonly apis: ApiDefinitionRegistry;
  readonly fetch?: EndpointTestFetch;
  readonly credentialResolver?: EndpointTestCredentialResolver;
}

/*** Creates the canonical API capability adapter over Runtime's existing data-operation executor. */
export function createRuntimeApiCapabilityExecutor(
  options: RuntimeApiCapabilityExecutorOptions,
): RuntimeCapabilityExecutor {
  return async (args) => executeRuntimeApiCapabilityAsync(args, options);
}

async function executeRuntimeApiCapabilityAsync(
  args: RuntimeCapabilityExecutionArgs,
  options: RuntimeApiCapabilityExecutorOptions,
): Promise<RuntimeCapabilityExecutionResult> {
  const target = resolveApiCapabilityTarget(args.capability, options.apis);
  if (target === undefined) return missingApiCapability(args.capability);
  const values = asBindingValueRecord(args.input);
  if (args.input !== undefined && values === undefined)
    return invalidApiCapabilityInput(args.capability);

  const result = await testEndpoint({
    api: target.api,
    credentialResolver: options.credentialResolver,
    endpointId: target.endpointId,
    fetch: options.fetch,
    operationId: target.operationId,
    values,
  });
  return result.ok
    ? { data: result.data ?? null, diagnostics: result.diagnostics, ok: true }
    : { diagnostics: result.diagnostics, ok: false };
}

function resolveApiCapabilityTarget(
  capability: string,
  apis: ApiDefinitionRegistry,
):
  | {
      readonly api: ApiDefinitionRegistry[string];
      readonly endpointId: string;
      readonly operationId: string;
    }
  | undefined {
  if (!capability.startsWith('api.')) return undefined;
  const target = capability.slice(4);
  const delimiter = target.indexOf('.');
  if (delimiter < 1 || delimiter === target.length - 1) return undefined;
  const apiId = target.slice(0, delimiter);
  const operationId = target.slice(delimiter + 1);
  const api = Object.entries(apis).find(([id]) => id === apiId)?.[1];
  if (api === undefined) return undefined;
  const endpoint = Object.values(api.endpoints).find((candidate) =>
    Object.hasOwn(candidate.operations, operationId),
  );
  return endpoint === undefined ? undefined : { api, endpointId: endpoint.id, operationId };
}

function asBindingValueRecord(
  value: BindingValue | undefined,
): Readonly<Record<string, BindingValue>> | undefined {
  return isBindingValueRecord(value) ? value : undefined;
}

function isBindingValueRecord(
  value: BindingValue | undefined,
): value is Readonly<Record<string, BindingValue>> {
  return isRecord(value);
}

function missingApiCapability(capability: string): RuntimeCapabilityExecutionResult {
  return {
    diagnostics: [
      {
        code: 'missing-operation',
        message: `API capability '${capability}' does not resolve to a configured API operation.`,
        severity: 'error',
      },
    ],
    ok: false,
  };
}

function invalidApiCapabilityInput(capability: string): RuntimeCapabilityExecutionResult {
  const diagnostic: DataSourceDiagnostic = {
    code: 'invalid-config',
    message: `API capability '${capability}' input must resolve to an object.`,
    severity: 'error',
  };
  return { diagnostics: [diagnostic], ok: false };
}
