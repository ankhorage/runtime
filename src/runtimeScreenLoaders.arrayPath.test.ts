import type {
  BindingOperationRef,
  OperationScreenDataLoaderDefinition,
} from '@ankhorage/contracts';
import { describe, expect, it } from 'bun:test';

import { createRuntimeBindingOperationKey } from './runtimeBindings';
import { createRuntimeScreenLoaderRequestKey } from './runtimeScreenLoaders';

const productListOperation: BindingOperationRef = {
  dataSourceId: 'nutrition-api',
  endpointId: 'products',
  operationId: 'nutrition.products.list',
};

const productDetailOperation: BindingOperationRef = {
  dataSourceId: 'nutrition-api',
  endpointId: 'products',
  operationId: 'nutrition.products.getById',
};

function createCachedProductDetailLoader(): OperationScreenDataLoaderDefinition {
  return {
    kind: 'operation',
    id: 'product-from-cache',
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

function createOperationResults(productId: string) {
  return {
    [createRuntimeBindingOperationKey(productListOperation)]: {
      products: [{ id: productId }],
    },
  };
}

describe('runtime screen loader cached array input paths', () => {
  it('derives request identity from cached operation array indexes', () => {
    const loaders = [createCachedProductDetailLoader()];
    const firstRequestKey = createRuntimeScreenLoaderRequestKey({
      loaders,
      operationResults: createOperationResults('product-1'),
      screenId: 'product-detail',
    });
    const equivalentRequestKey = createRuntimeScreenLoaderRequestKey({
      loaders,
      operationResults: {
        ...createOperationResults('product-1'),
        unrelated: {
          ignored: true,
        },
      },
      screenId: 'product-detail',
    });
    const changedRequestKey = createRuntimeScreenLoaderRequestKey({
      loaders,
      operationResults: createOperationResults('product-2'),
      screenId: 'product-detail',
    });

    expect(equivalentRequestKey).toBe(firstRequestKey);
    expect(changedRequestKey).not.toBe(firstRequestKey);
  });
});
