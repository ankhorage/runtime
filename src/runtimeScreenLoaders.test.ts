import type {
  BindingOperationRef,
  BindingValue,
  ComponentDataBindingRegistry,
  DataSourceRegistry,
  OperationScreenDataLoaderDefinition,
  ScreenSpec,
  UiNode,
} from '@ankhorage/contracts';
import { describe, expect, it } from 'bun:test';

import { createRuntimeBindingOperationKey, resolveRuntimeBindings } from './runtimeBindings';
import {
  beginRuntimeScreenOperationLoaderRequest,
  completeRuntimeScreenOperationLoaderRequest,
  createIdleRuntimeScreenOperationLoaderState,
  createPendingRuntimeScreenOperationLoaderState,
  createRuntimeScreenLoaderRequestKey,
  createRuntimeScreenOperationLoaderLifecycle,
  executeRuntimeScreenOperationLoaders,
  resolveScreenOperationLoaders,
} from './runtimeScreenLoaders';

const productDetailOperation: BindingOperationRef = {
  dataSourceId: 'nutrition-api',
  endpointId: 'products',
  operationId: 'nutrition.products.getById',
};

const productListOperation: BindingOperationRef = {
  dataSourceId: 'nutrition-api',
  endpointId: 'products',
  operationId: 'nutrition.products.list',
};

function createDataSources(): DataSourceRegistry {
  return {
    'nutrition-api': {
      id: 'nutrition-api',
      kind: 'rest',
      baseUrl: 'https://nutrition.example.com',
      endpoints: {
        products: {
          id: 'products',
          kind: 'http',
          operations: {
            'nutrition.products.getById': {
              id: 'nutrition.products.getById',
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
  };
}

function createDetailScreenRoot(): UiNode {
  return {
    id: 'product-header',
    type: 'ProductHeader',
  };
}

function createDetailLoader(id = 'product-detail'): OperationScreenDataLoaderDefinition {
  return {
    kind: 'operation',
    id,
    operation: productDetailOperation,
    input: {
      id: {
        kind: 'source',
        source: {
          kind: 'context',
          path: 'route.params.id',
        },
      },
    },
  };
}

function createCachedOperationInputLoader(
  id = 'product-from-cache',
): OperationScreenDataLoaderDefinition {
  return {
    kind: 'operation',
    id,
    operation: productDetailOperation,
    input: {
      id: {
        kind: 'source',
        source: {
          kind: 'operation',
          operation: productListOperation,
          path: 'products.0.id',
        },
      },
    },
  };
}

function createDetailScreen(args?: {
  readonly dataLoaders?: readonly OperationScreenDataLoaderDefinition[];
}): ScreenSpec {
  return {
    id: 'product-detail',
    name: 'Product Detail',
    root: createDetailScreenRoot(),
    dataLoaders: args?.dataLoaders ?? [createDetailLoader()],
  };
}

function createDetailBindings(): ComponentDataBindingRegistry {
  return {
    'product-header': {
      componentId: 'product-header',
      componentType: 'ProductHeader',
      props: {
        title: {
          source: {
            kind: 'operation',
            operation: productDetailOperation,
            path: 'product.name',
          },
        },
        subtitle: {
          source: {
            kind: 'operation',
            operation: productDetailOperation,
            path: 'product.brand',
          },
        },
        caption: {
          source: {
            kind: 'operation',
            operation: productDetailOperation,
            path: 'product.barcode',
          },
        },
      },
    },
  };
}

function createRouteBindingContext(id: string): Record<string, unknown> {
  return {
    route: {
      params: {
        id,
      },
    },
  };
}

describe('runtime screen operation loaders', () => {
  it('resolves loader input from route params, executes the operation, and caches the result under the standard operation key', async () => {
    const screen = createDetailScreen();
    const calls: { readonly input?: BindingValue; readonly operationId: string }[] = [];

    const result = await executeRuntimeScreenOperationLoaders({
      bindingContext: {
        route: {
          params: {
            id: 'product-1',
          },
        },
      },
      dataSources: createDataSources(),
      executeOperation: ({ input, operation }) => {
        calls.push({
          input,
          operationId: operation.operationId,
        });

        return Promise.resolve({
          ok: true as const,
          data: {
            product: {
              name: 'Bio Greek Yogurt 250 g',
              brand: 'Migros',
              barcode: '7612345678901',
            },
          },
        });
      },
      loaders: resolveScreenOperationLoaders(screen),
      screen,
    });

    expect(calls).toEqual([
      {
        input: { id: 'product-1' },
        operationId: 'nutrition.products.getById',
      },
    ]);
    expect(result.diagnostics).toEqual([]);
    expect(result.operationResults).toEqual({
      [createRuntimeBindingOperationKey(productDetailOperation)]: {
        product: {
          name: 'Bio Greek Yogurt 250 g',
          brand: 'Migros',
          barcode: '7612345678901',
        },
      },
    });

    expect(
      resolveRuntimeBindings({
        dataBindings: createDetailBindings(),
        dataSources: createDataSources(),
        node: createDetailScreenRoot(),
        operationResults: result.operationResults,
        props: {},
      }).props,
    ).toEqual({
      caption: '7612345678901',
      subtitle: 'Migros',
      title: 'Bio Greek Yogurt 250 g',
    });
  });

  it('changes both the request key and resolved dependency key when the route-param input changes', async () => {
    const screen = createDetailScreen();
    const loaders = resolveScreenOperationLoaders(screen);

    const firstRequestKey = createRuntimeScreenLoaderRequestKey({
      bindingContext: createRouteBindingContext('product-1'),
      loaders,
      screenId: screen.id,
    });
    const secondRequestKey = createRuntimeScreenLoaderRequestKey({
      bindingContext: createRouteBindingContext('product-2'),
      loaders,
      screenId: screen.id,
    });

    expect(firstRequestKey).not.toBe(secondRequestKey);

    const firstResult = await executeRuntimeScreenOperationLoaders({
      bindingContext: {
        route: {
          params: {
            id: 'product-1',
          },
        },
      },
      dataSources: createDataSources(),
      executeOperation: () =>
        Promise.resolve({
          ok: true as const,
          data: {
            product: {
              id: 'product-1',
            },
          },
        }),
      loaders,
      screen,
    });
    const secondResult = await executeRuntimeScreenOperationLoaders({
      bindingContext: {
        route: {
          params: {
            id: 'product-2',
          },
        },
      },
      dataSources: createDataSources(),
      executeOperation: () =>
        Promise.resolve({
          ok: true as const,
          data: {
            product: {
              id: 'product-2',
            },
          },
        }),
      loaders,
      screen,
    });

    expect(firstResult.dependencyKey).not.toBe(secondResult.dependencyKey);
  });

  it('keeps the same request key when surrounding binding-context identity changes but the resolved input does not', () => {
    const screen = createDetailScreen();
    const loaders = resolveScreenOperationLoaders(screen);

    const firstRequestKey = createRuntimeScreenLoaderRequestKey({
      bindingContext: createRouteBindingContext('product-1'),
      loaders,
      screenId: screen.id,
    });
    const secondRequestKey = createRuntimeScreenLoaderRequestKey({
      bindingContext: {
        route: {
          params: {
            id: 'product-1',
          },
        },
        session: {
          locale: 'de-CH',
        },
      },
      loaders,
      screenId: screen.id,
    });

    expect(firstRequestKey).toBe(secondRequestKey);
  });

  it('keeps the same request key when unrelated inherited operation results change', () => {
    const loaders = [createCachedOperationInputLoader()];
    const firstRequestKey = createRuntimeScreenLoaderRequestKey({
      loaders,
      operationResults: {
        [createRuntimeBindingOperationKey(productListOperation)]: {
          products: [{ id: 'product-1' }],
        },
      },
      screenId: 'product-detail',
    });
    const secondRequestKey = createRuntimeScreenLoaderRequestKey({
      loaders,
      operationResults: {
        [createRuntimeBindingOperationKey(productListOperation)]: {
          products: [{ id: 'product-1' }],
        },
        unrelated: {
          ignored: true,
        },
      },
      screenId: 'product-detail',
    });

    expect(firstRequestKey).toBe(secondRequestKey);
  });

  it('changes the request key when the loader definition or operation reference changes', () => {
    const screenId = 'product-detail';
    const routeBindingContext = createRouteBindingContext('product-1');
    const defaultRequestKey = createRuntimeScreenLoaderRequestKey({
      bindingContext: routeBindingContext,
      loaders: [createDetailLoader()],
      screenId,
    });
    const changedLoaderRequestKey = createRuntimeScreenLoaderRequestKey({
      bindingContext: routeBindingContext,
      loaders: [createDetailLoader('product-detail-alt')],
      screenId,
    });
    const changedOperationRequestKey = createRuntimeScreenLoaderRequestKey({
      bindingContext: routeBindingContext,
      loaders: [
        {
          ...createDetailLoader(),
          operation: {
            ...productDetailOperation,
            operationId: 'nutrition.products.getBySlug',
          },
        },
      ],
      screenId,
    });

    expect(changedLoaderRequestKey).not.toBe(defaultRequestKey);
    expect(changedOperationRequestKey).not.toBe(defaultRequestKey);
  });

  it('treats screens without operation loaders as a stable no-op lifecycle', () => {
    const screen = createDetailScreen({
      dataLoaders: [],
    });
    const loaders = resolveScreenOperationLoaders(screen);
    const firstRequestKey = createRuntimeScreenLoaderRequestKey({
      bindingContext: createRouteBindingContext('product-1'),
      loaders,
      screenId: screen.id,
    });
    const secondRequestKey = createRuntimeScreenLoaderRequestKey({
      bindingContext: createRouteBindingContext('product-2'),
      loaders,
      screenId: screen.id,
    });
    const emptyState = createIdleRuntimeScreenOperationLoaderState({
      dependencyKey: firstRequestKey,
    });

    expect(firstRequestKey).toBe(secondRequestKey);

    const firstRender = beginRuntimeScreenOperationLoaderRequest({
      hasLoaders: false,
      lifecycle: createRuntimeScreenOperationLoaderLifecycle(),
      requestKey: firstRequestKey,
      state: emptyState,
    });
    const secondRender = beginRuntimeScreenOperationLoaderRequest({
      hasLoaders: false,
      lifecycle: firstRender.lifecycle,
      requestKey: secondRequestKey,
      state: firstRender.state,
    });

    expect(firstRender.shouldExecute).toBe(false);
    expect(secondRender.shouldExecute).toBe(false);
    expect(firstRender.state).toBe(emptyState);
    expect(secondRender.state).toBe(emptyState);
    expect(emptyState.renderVersion).toBe(0);
    expect(emptyState.operationResults).toEqual({});
    expect(emptyState.diagnostics).toEqual([]);
  });

  it('does not re-execute or clear results when route params are semantically unchanged', () => {
    const screen = createDetailScreen();
    const loaders = resolveScreenOperationLoaders(screen);
    const firstRequestKey = createRuntimeScreenLoaderRequestKey({
      bindingContext: createRouteBindingContext('product-1'),
      loaders,
      screenId: screen.id,
    });
    const equivalentRequestKey = createRuntimeScreenLoaderRequestKey({
      bindingContext: createRouteBindingContext('product-1'),
      loaders,
      screenId: screen.id,
    });
    const initialState = createPendingRuntimeScreenOperationLoaderState({
      dependencyKey: firstRequestKey,
    });
    const firstRequest = beginRuntimeScreenOperationLoaderRequest({
      hasLoaders: true,
      lifecycle: createRuntimeScreenOperationLoaderLifecycle(),
      requestKey: firstRequestKey,
      state: initialState,
    });
    const completed = completeRuntimeScreenOperationLoaderRequest({
      lifecycle: firstRequest.lifecycle,
      requestId: firstRequest.requestId ?? 0,
      result: {
        dependencyKey: 'resolved:product-1',
        diagnostics: [],
        operationResults: {
          [createRuntimeBindingOperationKey(productDetailOperation)]: {
            product: {
              id: 'product-1',
              name: 'Loaded Product',
            },
          },
        },
      },
      state: firstRequest.state,
    });
    const equivalentRender = beginRuntimeScreenOperationLoaderRequest({
      hasLoaders: true,
      lifecycle: firstRequest.lifecycle,
      requestKey: equivalentRequestKey,
      state: completed.state,
    });

    expect(firstRequestKey).toBe(equivalentRequestKey);
    expect(firstRequest.shouldExecute).toBe(true);
    expect(completed.accepted).toBe(true);
    expect(equivalentRender.shouldExecute).toBe(false);
    expect(equivalentRender.state).toBe(completed.state);
    expect(equivalentRender.state.operationResults).toEqual(completed.state.operationResults);
    expect(equivalentRender.state.renderVersion).toBe(0);
  });

  it('clears stale results, re-executes, and ignores stale async completion when route params change', () => {
    const screen = createDetailScreen();
    const loaders = resolveScreenOperationLoaders(screen);
    const firstRequestKey = createRuntimeScreenLoaderRequestKey({
      bindingContext: createRouteBindingContext('product-1'),
      loaders,
      screenId: screen.id,
    });
    const secondRequestKey = createRuntimeScreenLoaderRequestKey({
      bindingContext: createRouteBindingContext('product-2'),
      loaders,
      screenId: screen.id,
    });
    const initialState = createPendingRuntimeScreenOperationLoaderState({
      dependencyKey: firstRequestKey,
    });
    const firstRequest = beginRuntimeScreenOperationLoaderRequest({
      hasLoaders: true,
      lifecycle: createRuntimeScreenOperationLoaderLifecycle(),
      requestKey: firstRequestKey,
      state: initialState,
    });
    const completedFirstRequest = completeRuntimeScreenOperationLoaderRequest({
      lifecycle: firstRequest.lifecycle,
      requestId: firstRequest.requestId ?? 0,
      result: {
        dependencyKey: 'resolved:product-1',
        diagnostics: [],
        operationResults: {
          [createRuntimeBindingOperationKey(productDetailOperation)]: {
            product: {
              id: 'product-1',
              name: 'Old Product',
            },
          },
        },
      },
      state: firstRequest.state,
    });
    const secondRequest = beginRuntimeScreenOperationLoaderRequest({
      hasLoaders: true,
      lifecycle: firstRequest.lifecycle,
      requestKey: secondRequestKey,
      state: completedFirstRequest.state,
    });
    const staleCompletion = completeRuntimeScreenOperationLoaderRequest({
      lifecycle: secondRequest.lifecycle,
      requestId: firstRequest.requestId ?? 0,
      result: {
        dependencyKey: 'resolved:stale',
        diagnostics: [],
        operationResults: {
          [createRuntimeBindingOperationKey(productDetailOperation)]: {
            product: {
              id: 'product-1',
              name: 'Stale Product',
            },
          },
        },
      },
      state: secondRequest.state,
    });
    const acceptedCompletion = completeRuntimeScreenOperationLoaderRequest({
      lifecycle: secondRequest.lifecycle,
      requestId: secondRequest.requestId ?? 0,
      result: {
        dependencyKey: 'resolved:product-2',
        diagnostics: [],
        operationResults: {
          [createRuntimeBindingOperationKey(productDetailOperation)]: {
            product: {
              id: 'product-2',
              name: 'Fresh Product',
            },
          },
        },
      },
      state: secondRequest.state,
    });

    expect(secondRequest.shouldExecute).toBe(true);
    expect(secondRequest.state).toEqual({
      dependencyKey: secondRequestKey,
      diagnostics: [],
      operationResults: {},
      renderVersion: 1,
    });
    expect(staleCompletion.accepted).toBe(false);
    expect(staleCompletion.state).toBe(secondRequest.state);
    expect(acceptedCompletion.accepted).toBe(true);
    expect(acceptedCompletion.state.operationResults).toEqual({
      [createRuntimeBindingOperationKey(productDetailOperation)]: {
        product: {
          id: 'product-2',
          name: 'Fresh Product',
        },
      },
    });
  });

  it('includes planning diagnostics alongside execution diagnostics', async () => {
    const screen = createDetailScreen({
      dataLoaders: [createDetailLoader('product-detail-a'), createDetailLoader('product-detail-b')],
    });

    const result = await executeRuntimeScreenOperationLoaders({
      bindingContext: createRouteBindingContext('product-1'),
      loaders: resolveScreenOperationLoaders(screen),
      screen,
    });

    expect(result.diagnostics).toEqual([
      {
        code: 'duplicate-operation-id',
        dataSourceId: 'nutrition-api',
        endpointId: 'products',
        operationId: 'nutrition.products.getById',
        message:
          "Screen operation loaders must not reuse operation key 'nutrition-api:products:nutrition.products.getById' on the same screen.",
        severity: 'error',
      },
      {
        code: 'missing-adapter',
        dataSourceId: 'nutrition-api',
        endpointId: 'products',
        operationId: 'nutrition.products.getById',
        message: 'Screen operation loader requires an injected operation executor.',
        severity: 'error',
      },
    ]);
  });

  it('reports one duplicate operation-loader diagnostic per duplicated operation key', async () => {
    const screen = createDetailScreen({
      dataLoaders: [createDetailLoader('product-detail-a'), createDetailLoader('product-detail-b')],
    });

    const result = await executeRuntimeScreenOperationLoaders({
      bindingContext: {
        route: {
          params: {
            id: 'product-1',
          },
        },
      },
      dataSources: createDataSources(),
      executeOperation: () =>
        Promise.resolve({
          ok: true as const,
          data: {
            product: {
              id: 'product-1',
            },
          },
        }),
      loaders: resolveScreenOperationLoaders(screen),
      screen,
    });

    expect(result.diagnostics).toEqual([
      {
        code: 'duplicate-operation-id',
        dataSourceId: 'nutrition-api',
        endpointId: 'products',
        operationId: 'nutrition.products.getById',
        message:
          "Screen operation loaders must not reuse operation key 'nutrition-api:products:nutrition.products.getById' on the same screen.",
        severity: 'error',
      },
    ]);
  });
});
