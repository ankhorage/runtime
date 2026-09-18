import type {
  ApiDefinition,
  ApiDefinitionRegistry,
  BindingOperationRef,
  DataEndpointConfig,
  DataSourceDiagnostic,
} from '@ankhorage/contracts';
import { readOwnProperty } from '@ankhorage/utility/object';

export interface RuntimeApiOperationSelection {
  readonly api: ApiDefinition;
  readonly endpoint: DataEndpointConfig;
}

export function validateRuntimeBindingOperationRef(
  operation: BindingOperationRef,
  apis: ApiDefinitionRegistry | undefined,
): readonly DataSourceDiagnostic[] {
  const api = findRuntimeApi(apis, operation.apiId);
  if (api === undefined) {
    return [
      createApiDiagnostic(operation, 'missing-api', `API '${operation.apiId}' could not be found.`),
    ];
  }

  const endpoint = resolveRuntimeApiEndpoint(operation, api);
  if (endpoint === undefined) {
    return [
      createApiDiagnostic(
        operation,
        'missing-endpoint',
        `Endpoint '${operation.endpointId ?? '<default>'}' could not be found.`,
      ),
    ];
  }

  if (readOwnProperty(endpoint.operations, operation.operationId) === undefined) {
    return [
      createApiDiagnostic(
        operation,
        'missing-operation',
        `Operation '${operation.operationId}' could not be found.`,
        endpoint.id,
      ),
    ];
  }

  return [];
}

export function resolveRuntimeBindingOperationSelection(
  operation: BindingOperationRef,
  apis: ApiDefinitionRegistry | undefined,
  diagnostics: DataSourceDiagnostic[],
): RuntimeApiOperationSelection | undefined {
  const validationDiagnostics = validateRuntimeBindingOperationRef(operation, apis);
  diagnostics.push(...validationDiagnostics);
  if (validationDiagnostics.length > 0) return undefined;

  const api = findRuntimeApi(apis, operation.apiId);
  if (api === undefined) return undefined;
  const endpoint = resolveRuntimeApiEndpoint(operation, api);
  return endpoint === undefined ? undefined : { api, endpoint };
}

function findRuntimeApi(
  apis: ApiDefinitionRegistry | undefined,
  apiId: string,
): ApiDefinition | undefined {
  return apis ? readOwnProperty<ApiDefinition>(apis, apiId) : undefined;
}

function resolveRuntimeApiEndpoint(
  operation: BindingOperationRef,
  api: ApiDefinition,
): DataEndpointConfig | undefined {
  if (operation.endpointId !== undefined) {
    return readOwnProperty<DataEndpointConfig>(api.endpoints, operation.endpointId);
  }

  return Object.values(api.endpoints).find(
    (endpoint) => readOwnProperty(endpoint.operations, operation.operationId) !== undefined,
  );
}

function createApiDiagnostic(
  operation: BindingOperationRef,
  code: DataSourceDiagnostic['code'],
  message: string,
  endpointId = operation.endpointId,
): DataSourceDiagnostic {
  return {
    apiId: operation.apiId,
    code,
    endpointId,
    message,
    operationId: operation.operationId,
    severity: 'error',
  };
}
