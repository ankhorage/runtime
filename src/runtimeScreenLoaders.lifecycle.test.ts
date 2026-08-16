import type { BindingOperationRef } from '@ankhorage/contracts';
import { describe, expect, it } from 'bun:test';

import { createRuntimeBindingOperationKey } from './runtimeBindings';
import {
  beginRuntimeScreenOperationLoaderRequest,
  completeRuntimeScreenOperationLoaderRequest,
  createIdleRuntimeScreenOperationLoaderState,
  createPendingRuntimeScreenOperationLoaderState,
  createRuntimeScreenOperationLoaderLifecycle,
} from './runtimeScreenLoaders';

const operation: BindingOperationRef = {
  apiId: 'nutrition',
  endpointId: 'products',
  operationId: 'products.getById',
};

function loadedResult(productId: string) {
  return {
    dependencyKey: `resolved:${productId}`,
    diagnostics: [],
    operationResults: {
      [createRuntimeBindingOperationKey(operation)]: {
        product: { id: productId },
      },
    },
  };
}

describe('runtime screen loader lifecycle', () => {
  it('keeps screens without loaders as a stable no-op', () => {
    const state = createIdleRuntimeScreenOperationLoaderState({
      dependencyKey: 'screen:detail:no-operation-loaders',
    });
    const result = beginRuntimeScreenOperationLoaderRequest({
      hasLoaders: false,
      lifecycle: createRuntimeScreenOperationLoaderLifecycle(),
      requestKey: 'screen:detail:no-operation-loaders',
      state,
    });

    expect(result.shouldExecute).toBe(false);
    expect(result.state).toBe(state);
    expect(result.state.operationResults).toEqual({});
  });

  it('does not execute again when the request key is unchanged', () => {
    const requestKey = 'request:product-1';
    const initial = createPendingRuntimeScreenOperationLoaderState({ dependencyKey: requestKey });
    const first = beginRuntimeScreenOperationLoaderRequest({
      hasLoaders: true,
      lifecycle: createRuntimeScreenOperationLoaderLifecycle(),
      requestKey,
      state: initial,
    });
    const completed = completeRuntimeScreenOperationLoaderRequest({
      lifecycle: first.lifecycle,
      requestId: first.requestId ?? 0,
      result: loadedResult('product-1'),
      state: first.state,
    });
    const equivalent = beginRuntimeScreenOperationLoaderRequest({
      hasLoaders: true,
      lifecycle: first.lifecycle,
      requestKey,
      state: completed.state,
    });

    expect(first.shouldExecute).toBe(true);
    expect(completed.accepted).toBe(true);
    expect(equivalent.shouldExecute).toBe(false);
    expect(equivalent.state).toBe(completed.state);
  });

  it('clears stale results and rejects completion from an older request', () => {
    const firstKey = 'request:product-1';
    const secondKey = 'request:product-2';
    const initial = createPendingRuntimeScreenOperationLoaderState({ dependencyKey: firstKey });
    const first = beginRuntimeScreenOperationLoaderRequest({
      hasLoaders: true,
      lifecycle: createRuntimeScreenOperationLoaderLifecycle(),
      requestKey: firstKey,
      state: initial,
    });
    const completedFirst = completeRuntimeScreenOperationLoaderRequest({
      lifecycle: first.lifecycle,
      requestId: first.requestId ?? 0,
      result: loadedResult('product-1'),
      state: first.state,
    });
    const second = beginRuntimeScreenOperationLoaderRequest({
      hasLoaders: true,
      lifecycle: first.lifecycle,
      requestKey: secondKey,
      state: completedFirst.state,
    });
    const stale = completeRuntimeScreenOperationLoaderRequest({
      lifecycle: second.lifecycle,
      requestId: first.requestId ?? 0,
      result: loadedResult('stale'),
      state: second.state,
    });
    const fresh = completeRuntimeScreenOperationLoaderRequest({
      lifecycle: second.lifecycle,
      requestId: second.requestId ?? 0,
      result: loadedResult('product-2'),
      state: second.state,
    });

    expect(second.shouldExecute).toBe(true);
    expect(second.state.operationResults).toEqual({});
    expect(second.state.renderVersion).toBe(1);
    expect(stale.accepted).toBe(false);
    expect(stale.state).toBe(second.state);
    expect(fresh.accepted).toBe(true);
    expect(fresh.state.operationResults).toEqual(loadedResult('product-2').operationResults);
  });
});
