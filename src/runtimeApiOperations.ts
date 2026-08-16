import type { BindingValue, DataSourceDiagnostic } from '@ankhorage/contracts';
import type { EndpointTestCredentialResolver, EndpointTestFetch } from '@ankhorage/data-sources';
import { testEndpoint } from '@ankhorage/data-sources';

import type { RuntimeBindingOperationExecutor } from './runtimeBindings';

export interface RuntimeApiOperationExecutorOptions {
  readonly fetch?: EndpointTestFetch;
  readonly credentialResolver?: EndpointTestCredentialResolver;
}

export function createRuntimeApiOperationExecutor(
  options: RuntimeApiOperationExecutorOptions,
): RuntimeBindingOperationExecutor {
  return async ({ api, endpoint, input, operation }) => {
    const values = asBindingValueRecord(input);
    if (input !== undefined && values === undefined) {
      return invalidInput(operation.apiId, endpoint.id, operation.operationId);
    }

    const result = await testEndpoint({
      api,
      credentialResolver: options.credentialResolver,
      endpointId: endpoint.id,
      fetch: options.fetch,
      operationId: operation.operationId,
      values,
    });

    return result.ok
      ? { ok: true, data: result.data ?? null, diagnostics: result.diagnostics }
      : { ok: false, diagnostics: result.diagnostics };
  };
}

function invalidInput(apiId: string, endpointId: string, operationId: string) {
  const diagnostic: DataSourceDiagnostic = {
    apiId,
    code: 'invalid-config',
    endpointId,
    message: 'API operation input must resolve to an object.',
    operationId,
    severity: 'error',
  };
  return { ok: false as const, diagnostics: [diagnostic] };
}

function asBindingValueRecord(
  value: BindingValue | undefined,
): Readonly<Record<string, BindingValue>> | undefined {
  return isBindingValueRecord(value) ? value : undefined;
}

function isBindingValueRecord(
  value: BindingValue | undefined,
): value is Readonly<Record<string, BindingValue>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
