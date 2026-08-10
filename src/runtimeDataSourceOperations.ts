import type { BindingValue, DataSourceDiagnostic, DbAdapter } from '@ankhorage/contracts';
import type { EndpointTestCredentialResolver, EndpointTestFetch } from '@ankhorage/data-sources';
import { testEndpoint } from '@ankhorage/data-sources';

import type { RuntimeBindingOperationExecutor } from './runtimeBindings';
import { executeRuntimeDatabaseOperation } from './runtimeDatabaseOperationExecutor';

export interface RuntimeDataSourceOperationExecutorOptions {
  readonly fetch?: EndpointTestFetch;
  readonly credentialResolver?: EndpointTestCredentialResolver;
  readonly databaseAdapters?: Readonly<Record<string, DbAdapter>>;
}

export function createRuntimeDataSourceOperationExecutor(
  options: RuntimeDataSourceOperationExecutorOptions,
): RuntimeBindingOperationExecutor {
  return async ({ dataSource, endpoint, input, operation }) => {
    if (endpoint === undefined) {
      return missingEndpoint(operation.dataSourceId, operation.endpointId, operation.operationId);
    }

    const operationConfig = endpoint.operations[operation.operationId];
    if (operationConfig === undefined) {
      return missingOperation(operation.dataSourceId, endpoint.id, operation.operationId);
    }

    const values = asBindingValueRecord(input);
    if (input !== undefined && values === undefined) {
      return invalidInput(operation.dataSourceId, endpoint.id, operation.operationId);
    }

    if (operationConfig.protocol === 'database') {
      return executeRuntimeDatabaseOperation({
        dataSource,
        operation: operationConfig,
        input: values,
        databaseAdapters: options.databaseAdapters,
      });
    }

    const result = await testEndpoint({
      credentialResolver: options.credentialResolver,
      dataSource,
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

function missingEndpoint(
  dataSourceId: string,
  endpointId: string | undefined,
  operationId: string,
) {
  return failure(
    dataSourceId,
    endpointId,
    operationId,
    'missing-endpoint',
    `Endpoint '${endpointId ?? '<default>'}' could not be found.`,
  );
}

function missingOperation(dataSourceId: string, endpointId: string, operationId: string) {
  return failure(
    dataSourceId,
    endpointId,
    operationId,
    'missing-operation',
    `Operation '${operationId}' could not be found.`,
  );
}

function invalidInput(dataSourceId: string, endpointId: string, operationId: string) {
  return failure(
    dataSourceId,
    endpointId,
    operationId,
    'invalid-config',
    'Operation input must resolve to an object.',
  );
}

function failure(
  dataSourceId: string,
  endpointId: string | undefined,
  operationId: string,
  code: string,
  message: string,
) {
  const diagnostic: DataSourceDiagnostic = {
    code,
    dataSourceId,
    endpointId,
    operationId,
    message,
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
