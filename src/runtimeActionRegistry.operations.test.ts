import type {
  ApiDefinitionList,
  BindingOperationRef,
  BindingValue,
  ComponentDataBindingRegistry,
  UiNode,
} from '@ankhorage/contracts';
import { describe, expect, it } from 'bun:test';

import { dispatchRuntimeComponentEvent } from './runtimeActionRegistry';
import {
  createRuntimeBindingOperationKey,
  resolveRuntimeBindings,
  type RuntimeBindingOperationResultCache,
} from './runtimeBindings';

const postsOperation: BindingOperationRef = {
  apiId: 'cms',
  endpointId: 'posts',
  operationId: 'posts.list',
};

function createApis(): ApiDefinitionList {
  return [
    {
      id: 'cms',
      origin: 'external',
      protocol: 'rest',
      baseUrl: 'https://cms.example.com',
      endpoints: {
        posts: {
          id: 'posts',
          kind: 'http',
          operations: {
            'posts.list': {
              id: 'posts.list',
              endpointId: 'posts',
              protocol: 'http',
              intent: 'read',
              method: 'GET',
              path: '/posts',
            },
            'posts.create': {
              id: 'posts.create',
              endpointId: 'posts',
              protocol: 'http',
              intent: 'create',
              method: 'POST',
              path: '/posts',
            },
          },
        },
      },
    },
  ];
}

function createOperationBindings(operation = postsOperation): ComponentDataBindingRegistry {
  return {
    'refresh-posts-button': {
      componentId: 'refresh-posts-button',
      events: {
        press: [{ target: { kind: 'operation', operation } }],
      },
    },
    'posts-list': {
      componentId: 'posts-list',
      props: {
        items: {
          source: { kind: 'operation', operation, path: 'items' },
          fallback: { value: [] },
        },
      },
    },
  };
}

function refreshEventArgs() {
  const node: UiNode = { id: 'refresh-posts-button', type: 'Button' };
  return {
    node,
    eventName: 'press',
    event: { type: 'button.press', sourceNodeId: node.id, payload: {} },
  } as const;
}

describe('runtime action registry API operations', () => {
  it('selects the canonical API operation before invoking the executor', async () => {
    const calls: object[] = [];
    const operation: BindingOperationRef = {
      apiId: 'cms',
      endpointId: 'posts',
      operationId: 'posts.create',
    };
    const diagnostics = await dispatchRuntimeComponentEvent({
      ...refreshEventArgs(),
      apis: createApis(),
      dataBindings: {
        'refresh-posts-button': {
          componentId: 'refresh-posts-button',
          events: {
            press: [
              {
                target: { kind: 'operation', operation },
                input: { title: { kind: 'literal', value: 'Hello' } },
              },
            ],
          },
        },
      },
      executeOperation: ({ api, endpoint, input, operation: selectedOperation }) => {
        calls.push({
          apiId: api.id,
          endpointId: endpoint.id,
          input,
          operationId: selectedOperation.operationId,
        });
        return Promise.resolve({ ok: true, data: { id: 'post-1' } });
      },
    });

    expect(diagnostics).toEqual([]);
    expect(calls).toEqual([
      {
        apiId: 'cms',
        endpointId: 'posts',
        input: { title: 'Hello' },
        operationId: 'posts.create',
      },
    ]);
  });

  it('writes successful API results so synchronous prop bindings can reuse them', async () => {
    const operationResults: Record<string, BindingValue> = {};
    const dataBindings = createOperationBindings();
    const diagnostics = await dispatchRuntimeComponentEvent({
      ...refreshEventArgs(),
      apis: createApis(),
      dataBindings,
      executeOperation: () =>
        Promise.resolve({
          ok: true,
          data: { items: [{ id: 'post-1', title: 'Hello' }] },
        }),
      writeOperationResult: (key, value) => {
        operationResults[key] = value;
      },
    });

    const bound = resolveRuntimeBindings({
      apis: createApis(),
      dataBindings,
      node: { id: 'posts-list', type: 'List' },
      operationResults,
      props: {},
    });

    expect(diagnostics).toEqual([]);
    expect(bound.props).toEqual({ items: [{ id: 'post-1', title: 'Hello' }] });
  });

  it('does not replace cached API results when execution fails', async () => {
    const operationKey = createRuntimeBindingOperationKey(postsOperation);
    const operationResults: RuntimeBindingOperationResultCache = {
      [operationKey]: { items: [{ id: 'existing-post' }] },
    };
    const written: Record<string, BindingValue> = {};
    const diagnostics = await dispatchRuntimeComponentEvent({
      ...refreshEventArgs(),
      apis: createApis(),
      dataBindings: createOperationBindings(),
      operationResults,
      executeOperation: () =>
        Promise.resolve({
          ok: false,
          diagnostics: [
            {
              apiId: 'cms',
              code: 'adapter-error',
              endpointId: 'posts',
              message: 'Network failed.',
              operationId: 'posts.list',
              severity: 'error',
            },
          ],
        }),
      writeOperationResult: (key, value) => {
        written[key] = value;
      },
    });

    expect(diagnostics.map((diagnostic) => diagnostic.code)).toEqual(['adapter-error']);
    expect(written).toEqual({});
    expect(operationResults[operationKey]).toEqual({ items: [{ id: 'existing-post' }] });
  });

  it('returns missing-api before an operation executor can run', async () => {
    let executorCalls = 0;
    const diagnostics = await dispatchRuntimeComponentEvent({
      ...refreshEventArgs(),
      apis: [],
      dataBindings: createOperationBindings(),
      executeOperation: () => {
        executorCalls += 1;
        return Promise.resolve({ ok: true, data: null });
      },
    });

    expect(executorCalls).toBe(0);
    expect(diagnostics).toEqual([
      {
        apiId: 'cms',
        code: 'missing-api',
        endpointId: 'posts',
        message: "API 'cms' could not be found.",
        operationId: 'posts.list',
        severity: 'error',
      },
    ]);
  });
});
