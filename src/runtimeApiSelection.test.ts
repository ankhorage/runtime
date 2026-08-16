import type { ApiDefinitionList, BindingOperationRef } from '@ankhorage/contracts';
import { describe, expect, it } from 'bun:test';

import { validateRuntimeBindingOperationRef } from './runtimeApiSelection';

function createApis(): ApiDefinitionList {
  return [
    {
      id: 'nutrition',
      origin: 'external',
      protocol: 'rest',
      baseUrl: 'https://api.ankhorage.com/v1/nutrition',
      endpoints: {
        products: {
          id: 'products',
          kind: 'http',
          operations: {
            'products.list': {
              id: 'products.list',
              endpointId: 'products',
              protocol: 'http',
              intent: 'read',
              method: 'GET',
              path: '/products',
            },
          },
        },
      },
    },
  ];
}

function operation(overrides: Partial<BindingOperationRef> = {}): BindingOperationRef {
  return {
    apiId: 'nutrition',
    endpointId: 'products',
    operationId: 'products.list',
    ...overrides,
  };
}

describe('validateRuntimeBindingOperationRef', () => {
  it('accepts a canonical API operation reference', () => {
    expect(validateRuntimeBindingOperationRef(operation(), createApis())).toEqual([]);
  });

  it('reports missing API identity', () => {
    expect(
      validateRuntimeBindingOperationRef(operation({ apiId: 'missing' }), createApis()),
    ).toMatchObject([{ apiId: 'missing', code: 'missing-api' }]);
  });

  it('reports missing endpoint identity', () => {
    expect(
      validateRuntimeBindingOperationRef(operation({ endpointId: 'missing' }), createApis()),
    ).toMatchObject([{ apiId: 'nutrition', code: 'missing-endpoint', endpointId: 'missing' }]);
  });

  it('reports missing operation identity', () => {
    expect(
      validateRuntimeBindingOperationRef(
        operation({ operationId: 'products.missing' }),
        createApis(),
      ),
    ).toMatchObject([
      {
        apiId: 'nutrition',
        code: 'missing-operation',
        endpointId: 'products',
        operationId: 'products.missing',
      },
    ]);
  });
});
