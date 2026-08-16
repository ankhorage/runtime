import type { ApiDefinition, DataEndpointConfig } from '@ankhorage/contracts';
import { describe, expect, it } from 'bun:test';

import { createRuntimeApiOperationExecutor } from './runtimeApiOperations';

function createNutritionApi(): ApiDefinition {
  return {
    id: 'nutrition',
    origin: 'external',
    protocol: 'rest',
    baseUrl: 'https://api.ankhorage.com/v1/nutrition',
    endpoints: {
      products: createProductsEndpoint(),
    },
  };
}

function createProductsEndpoint(): DataEndpointConfig {
  return {
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
  };
}

function getProductsEndpoint(api: ApiDefinition): DataEndpointConfig {
  const endpoint = api.endpoints.products;
  if (endpoint === undefined) throw new Error('Expected products endpoint fixture.');
  return endpoint;
}

describe('createRuntimeApiOperationExecutor', () => {
  it('executes Nutrition products over canonical external HTTP', async () => {
    const api = createNutritionApi();
    const endpoint = getProductsEndpoint(api);
    const calls: string[] = [];
    const executor = createRuntimeApiOperationExecutor({
      fetch: (url, init) => {
        calls.push(`${init.method} ${url}`);
        return Promise.resolve({
          status: 200,
          headers: { 'content-type': 'application/json' },
          text: () => Promise.resolve('{"products":[{"id":"apple"}]}'),
        });
      },
    });

    const result = await executor({
      api,
      endpoint,
      operation: {
        apiId: 'nutrition',
        endpointId: 'products',
        operationId: 'products.list',
      },
    });

    expect(calls).toEqual(['GET https://api.ankhorage.com/v1/nutrition/products']);
    expect(calls.some((call) => call.includes('/rest/v1/'))).toBe(false);
    expect(result).toEqual({
      ok: true,
      data: { products: [{ id: 'apple' }] },
      diagnostics: [],
    });
  });

  it('rejects non-object API operation input before execution', async () => {
    const api = createNutritionApi();
    const result = await createRuntimeApiOperationExecutor({})({
      api,
      endpoint: getProductsEndpoint(api),
      input: 'not-an-object',
      operation: {
        apiId: 'nutrition',
        endpointId: 'products',
        operationId: 'products.list',
      },
    });

    expect(result).toEqual({
      ok: false,
      diagnostics: [
        {
          apiId: 'nutrition',
          code: 'invalid-config',
          endpointId: 'products',
          message: 'API operation input must resolve to an object.',
          operationId: 'products.list',
          severity: 'error',
        },
      ],
    });
  });

  it('keeps internal APIs unsupported and never falls back to another transport', async () => {
    const calls: string[] = [];
    const api: ApiDefinition = {
      id: 'internal-products',
      origin: 'internal',
      protocol: 'rest',
      basePath: '/v1/products',
      endpoints: {
        products: createProductsEndpoint(),
      },
    };
    const result = await createRuntimeApiOperationExecutor({
      fetch: (url) => {
        calls.push(url);
        throw new Error('Internal API phase-1 execution must not reach fetch.');
      },
    })({
      api,
      endpoint: getProductsEndpoint(api),
      operation: {
        apiId: 'internal-products',
        endpointId: 'products',
        operationId: 'products.list',
      },
    });

    expect(result.ok).toBe(false);
    expect(calls).toEqual([]);
    if (!result.ok) {
      expect(result.diagnostics.map((diagnostic) => diagnostic.message).join('\n')).toContain(
        'Internal APIs are not executable in API phase 1.',
      );
    }
  });
});
