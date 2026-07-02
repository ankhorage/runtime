import type {
  BindingValue,
  ComponentDataBindingRegistry,
  DataSourceRegistry,
  UiNode,
} from '@ankhorage/contracts';
import { describe, expect, it } from 'bun:test';

import { dispatchRuntimeComponentEvent } from './runtimeActionRegistry';
import { resolveRuntimeBindings } from './runtimeBindings';
import {
  createRuntimeRepeatBindingContext,
  resolveRuntimeRepeatItemKey,
  resolveRuntimeRepeatItemsAsync,
  resolveRuntimeRepeatItemsSync,
} from './runtimeRepeat';

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
            'products.list': {
              id: 'products.list',
              endpointId: 'products',
              protocol: 'http',
              intent: 'read',
              method: 'GET',
              path: '/',
            },
          },
        },
      },
    },
  };
}

function createRepeatedGridNode(): UiNode {
  return {
    id: 'products-grid',
    type: 'Grid',
    repeat: {
      source: {
        kind: 'operation',
        operation: {
          dataSourceId: 'nutrition-api',
          endpointId: 'products',
          operationId: 'products.list',
        },
        path: 'products',
      },
      itemAlias: 'item',
      keyPath: 'id',
    },
    children: [
      {
        id: 'product-card-template',
        type: 'ProductCard',
      },
    ],
  };
}

function createRepeatedCardBindings(): ComponentDataBindingRegistry {
  return {
    'product-card-template': {
      componentId: 'product-card-template',
      componentType: 'ProductCard',
      props: {
        title: {
          source: {
            kind: 'context',
            path: 'item.name',
          },
        },
        brand: {
          source: {
            kind: 'context',
            path: 'item.brand',
          },
        },
        description: {
          source: {
            kind: 'context',
            path: 'item.barcode',
          },
        },
      },
      events: {
        press: [
          {
            target: {
              kind: 'action',
              type: 'navigate',
            },
            input: {
              route: {
                kind: 'literal',
                value: '/products/[id]',
              },
              params: {
                kind: 'object',
                fields: {
                  id: {
                    kind: 'source',
                    source: {
                      kind: 'context',
                      path: 'item.id',
                    },
                  },
                },
              },
            },
          },
        ],
      },
    },
  };
}

describe('runtime repeat resolution', () => {
  it('loads repeated items from an operation result and resolves repeated card bindings from item context', async () => {
    const node = createRepeatedGridNode();
    const { repeat } = node;
    const productCardTemplate = node.children?.[0];
    const operationResults: Record<string, BindingValue> = {};
    if (!repeat || !productCardTemplate) {
      throw new Error('Expected repeated grid test fixture to define repeat metadata and a child.');
    }

    const repeatResult = await resolveRuntimeRepeatItemsAsync(repeat, {
      dataSources: createDataSources(),
      executeOperation: () =>
        Promise.resolve({
          ok: true,
          data: {
            products: [
              {
                id: 'product-1',
                name: 'Bio Greek Yogurt 250 g',
                brand: 'Migros',
                barcode: '7612345678901',
              },
              {
                id: 'product-2',
                name: 'Haferdrink Barista 1 l',
                brand: 'Coop',
                barcode: '7612345678918',
              },
            ],
          },
        }),
      node,
      operationResults,
      writeOperationResult: (key, value) => {
        operationResults[key] = value;
      },
    });

    expect(repeatResult.diagnostics).toEqual([]);
    expect(repeatResult.items).toHaveLength(2);
    const [firstItem] = repeatResult.items;
    if (!firstItem) {
      throw new Error('Expected repeat result to contain a first item.');
    }

    expect(resolveRuntimeRepeatItemKey({ item: firstItem, index: 0 })).toBe('product-1');

    const firstCardProps = resolveRuntimeBindings({
      context: createRuntimeRepeatBindingContext({
        item: firstItem,
      }),
      dataBindings: createRepeatedCardBindings(),
      node: productCardTemplate,
      props: {},
    }).props;

    expect(firstCardProps).toEqual({
      brand: 'Migros',
      description: '7612345678901',
      title: 'Bio Greek Yogurt 250 g',
    });
  });

  it('uses cached repeat operation results during synchronous rendering', () => {
    const node = createRepeatedGridNode();
    const { repeat } = node;
    if (!repeat) {
      throw new Error('Expected repeated grid test fixture to define repeat metadata.');
    }

    const result = resolveRuntimeRepeatItemsSync(repeat, {
      dataSources: createDataSources(),
      node,
      operationResults: {
        'nutrition-api:products:products.list': {
          products: [{ id: 'product-1', name: 'Bio Greek Yogurt 250 g' }],
        },
      },
    });

    expect(result.status).toBe('ready');
    expect(result.diagnostics).toEqual([]);
    expect(result.items).toEqual([{ id: 'product-1', name: 'Bio Greek Yogurt 250 g' }]);
  });

  it('returns diagnostics and no items when the repeat source does not resolve to an array', async () => {
    const node = createRepeatedGridNode();
    const { repeat } = node;
    if (!repeat) {
      throw new Error('Expected repeated grid test fixture to define repeat metadata.');
    }

    const result = await resolveRuntimeRepeatItemsAsync(repeat, {
      dataSources: createDataSources(),
      executeOperation: () =>
        Promise.resolve({
          ok: true,
          data: {
            product: { id: 'product-1' },
          },
        }),
      node,
    });

    expect(result.items).toEqual([]);
    expect(result.diagnostics).toEqual([
      {
        code: 'invalid-config',
        dataSourceId: 'nutrition-api',
        endpointId: 'products',
        operationId: 'products.list',
        message: 'Repeat source must resolve to an array.',
        severity: 'error',
      },
    ]);
  });

  it('reads wrapped products arrays through repeat.source.path', async () => {
    const node = createRepeatedGridNode();
    const { repeat } = node;
    if (!repeat) {
      throw new Error('Expected repeated grid test fixture to define repeat metadata.');
    }

    const result = await resolveRuntimeRepeatItemsAsync(repeat, {
      dataSources: createDataSources(),
      executeOperation: () =>
        Promise.resolve({
          ok: true,
          data: {
            products: [{ id: 'product-3', name: 'Skyr Natural 450 g' }],
          },
        }),
      node,
    });

    expect(result.diagnostics).toEqual([]);
    expect(result.items).toEqual([{ id: 'product-3', name: 'Skyr Natural 450 g' }]);
  });

  it('navigates repeated product-card presses with context.item.id', async () => {
    const executedActions: { type: string; payload?: object }[] = [];

    const diagnostics = await dispatchRuntimeComponentEvent({
      context: {
        item: {
          id: 'product-1',
        },
      },
      dataBindings: createRepeatedCardBindings(),
      event: {
        type: 'productCard.press',
        sourceNodeId: 'product-card-template',
        payload: {},
      },
      eventName: 'press',
      executeAction: ({ action }) => {
        executedActions.push(action);
      },
      node: {
        id: 'product-card-template',
        type: 'ProductCard',
      },
    });

    expect(diagnostics).toEqual([]);
    expect(executedActions).toEqual([
      {
        type: 'navigate',
        payload: {
          route: '/products/[id]',
          params: {
            id: 'product-1',
          },
        },
      },
    ]);
  });
});
