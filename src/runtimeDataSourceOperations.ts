import type { BindingValue, DataSourceDiagnostic } from '@ankhorage/contracts';
import type { EndpointTestCredentialResolver, EndpointTestFetch } from '@ankhorage/data-sources';
import { testEndpoint } from '@ankhorage/data-sources';

import type { RuntimeBindingOperationExecutor } from './runtimeBindings';

export interface RuntimeDataSourceOperationExecutorOptions {
  readonly fetch: EndpointTestFetch;
  readonly credentialResolver?: EndpointTestCredentialResolver;
}

export function createRuntimeDataSourceOperationExecutor(
  options: RuntimeDataSourceOperationExecutorOptions,
): RuntimeBindingOperationExecutor {
  return async ({ dataSource, endpoint, input, operation }) => {
    if (endpoint === undefined) {
      return {
        ok: false,
        diagnostics: [
          createRuntimeDataSourceOperationDiagnostic(
            operation.dataSourceId,
            operation.endpointId,
            operation.operationId,
            `Endpoint '${operation.endpointId ?? '<default>'}' could not be found.`,
          ),
        ],
      };
    }

    const values = asBindingValueRecord(input);
    if (input !== undefined && values === undefined) {
      return {
        ok: false,
        diagnostics: [
          createRuntimeDataSourceOperationDiagnostic(
            operation.dataSourceId,
            endpoint.id,
            operation.operationId,
            'Operation input must resolve to an object.',
          ),
        ],
      };
    }

    const result = await testEndpoint({
      credentialResolver: options.credentialResolver,
      dataSource,
      endpointId: endpoint.id,
      fetch: options.fetch,
      operationId: operation.operationId,
      values,
    });

    if (!result.ok) {
      return {
        ok: false,
        diagnostics: result.diagnostics,
      };
    }

    return {
      ok: true,
      data: result.data ?? null,
      diagnostics: result.diagnostics,
    };
  };
}

function createRuntimeDataSourceOperationDiagnostic(
  dataSourceId: string,
  endpointId: string | undefined,
  operationId: string,
  message: string,
): DataSourceDiagnostic {
  return {
    code: 'invalid-config',
    dataSourceId,
    endpointId,
    operationId,
    message,
    severity: 'error',
  };
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
