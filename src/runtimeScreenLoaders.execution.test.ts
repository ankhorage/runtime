import type {
  ApiDefinitionList,
  BindingOperationRef,
  BindingValue,
  ComponentDataBindingRegistry,
  OperationScreenDataLoaderDefinition,
  ScreenSpec,
} from '@ankhorage/contracts';
import { describe, expect, it } from 'bun:test';

import { createRuntimeBindingOperationKey, resolveRuntimeBindings } from './runtimeBindings';
import {
  createRuntimeScreenLoaderRequestKey,
  executeRuntimeScreenOperationLoaders,
  resolveScreenOperationLoaders,
} from './runtimeScreenLoaders';

const productDetailOperation: BindingOperationRef = {
  apiId: 'nutrition',
  endpointId: 'products',
  operationId: 'products.getById',
};

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
            'products.getById': {
              id: 'products.getById',
              endpointId: 'products',
              protocol: 'http',
              intent: 'read',
              method: 'GET',
              path: '/products/{id}',
            },
          },
        },
      },
    },
  ];
}

function createLoader(id = 'product-detail'): OperationScreenDataLoaderDefinition {
  return {
    kind: 'operation',
    id,
    operation: productDetailOperation,
    input: {
      id: {
        kind: 'source',
        source: { kind: 'context', path: 'route.params.id' },
      },
    },
  };
}

function createScreen(
  dataLoaders: readonly OperationScreenDataLoaderDefinition[] = [createLoader()],
): ScreenSpec {
  return {
    id: 'product-detail',
    name: 'Product Detail',
    root: { id: 'product-header', type: 'ProductHeader' },
    dataLoaders,
  };
}

function createBindings(): ComponentDataBindingRegistry {
  return {
    'product-header': {
      componentId: 'product-header',
      props: {
        title: {
          source: {
            kind: 'operation',
            operation: productDetailOperation,
            path: 'product.name',
          },
        },
      },
    },
  };
}

function routeContext(id: string): Record<string, unknown> {
  return { route: { params: { id } } };
}

describe('runtime screen loader execution', () => {
  it('resolves input, executes the selected API operation, and caches its result', async () => {
    const screen = createScreen();
    const calls: { readonly input?: BindingValue; readonly operationId: string }[] = [];
    const result = await executeRuntimeScreenOperationLoaders({
      apis: createApis(),
      bindingContext: routeContext('product-1'),
      executeOperation: ({ input, operation }) => {
        calls.push({ input, operationId: operation.operationId });
        return Promise.resolve({
          ok: true,
          data: { product: { id: 'product-1', name: 'Bio Greek Yogurt' } },
        });
      },
      loaders: resolveScreenOperationLoaders(screen),
      screen,
    });

    expect(calls).toEqual([{ input: { id: 'product-1' }, operationId: 'products.getById' }]);
    expect(result.diagnostics).toEqual([]);
    expect(result.operationResults).toEqual({
      [createRuntimeBindingOperationKey(productDetailOperation)]: {
        product: { id: 'product-1', name: 'Bio Greek Yogurt' },
      },
    });
    expect(
      resolveRuntimeBindings({
        apis: createApis(),
        dataBindings: createBindings(),
        node: screen.root,
        operationResults: result.operationResults,
        props: {},
      }).props,
    ).toEqual({ title: 'Bio Greek Yogurt' });
  });

  it('keys requests by resolved loader input rather than surrounding context identity', () => {
    const loaders = [createLoader()];
    const first = createRuntimeScreenLoaderRequestKey({
      bindingContext: routeContext('product-1'),
      loaders,
      screenId: 'product-detail',
    });
    const equivalent = createRuntimeScreenLoaderRequestKey({
      bindingContext: { ...routeContext('product-1'), session: { locale: 'de-CH' } },
      loaders,
      screenId: 'product-detail',
    });
    const changed = createRuntimeScreenLoaderRequestKey({
      bindingContext: routeContext('product-2'),
      loaders,
      screenId: 'product-detail',
    });

    expect(equivalent).toBe(first);
    expect(changed).not.toBe(first);
  });

  it('reports duplicate API operation loaders and a missing executor deterministically', async () => {
    const screen = createScreen([createLoader('first'), createLoader('second')]);
    const result = await executeRuntimeScreenOperationLoaders({
      apis: createApis(),
      bindingContext: routeContext('product-1'),
      loaders: resolveScreenOperationLoaders(screen),
      screen,
    });

    expect(result.diagnostics).toEqual([
      {
        apiId: 'nutrition',
        code: 'duplicate-operation-id',
        endpointId: 'products',
        message:
          "Screen operation loaders must not reuse operation key 'nutrition:products:products.getById' on the same screen.",
        operationId: 'products.getById',
        severity: 'error',
      },
      {
        apiId: 'nutrition',
        code: 'missing-adapter',
        endpointId: 'products',
        message: 'Screen API operation loader requires an injected operation executor.',
        operationId: 'products.getById',
        severity: 'error',
      },
    ]);
  });
});
