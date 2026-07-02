import type {
  BindingValue,
  ComponentDataBindingRegistry,
  DataSourceRegistry,
  UiNode,
} from '@ankhorage/contracts';
import { describe, expect, it } from 'bun:test';

import {
  createComponentEventFromHandlerArgs,
  createRuntimeActionRegistry,
  dispatchRuntimeComponentEvent,
  wrapRuntimeEventProps,
} from './runtimeActionRegistry';
import {
  createRuntimeBindingOperationKey,
  resolveRuntimeBindings,
  type RuntimeBindingOperationResultCache,
} from './runtimeBindings';

function isNoArgFunction(value: unknown): value is () => unknown {
  return typeof value === 'function';
}

function createDataSources(): DataSourceRegistry {
  return {
    cms: {
      id: 'cms',
      kind: 'rest',
      baseUrl: 'https://cms.example.com',
      endpoints: {
        posts: {
          id: 'posts',
          kind: 'http',
          operations: {
            'posts.create': {
              id: 'posts.create',
              endpointId: 'posts',
              protocol: 'http',
              intent: 'create',
              method: 'POST',
              path: '/posts',
            },
            'posts.list': {
              id: 'posts.list',
              endpointId: 'posts',
              protocol: 'http',
              intent: 'read',
              method: 'GET',
              path: '/posts',
            },
          },
        },
      },
    },
  };
}

describe('runtime action registry', () => {
  it('dispatches component event bindings to registered action handlers', async () => {
    const handledActionTypes: string[] = [];
    const handledPayloads: object[] = [];
    const node: UiNode = {
      id: 'contact-form',
      type: 'Form',
    };
    const dataBindings: ComponentDataBindingRegistry = {
      'contact-form': {
        componentId: 'contact-form',
        events: {
          submit: [
            {
              target: { kind: 'action', type: 'email.send' },
              input: {
                message: {
                  kind: 'source',
                  source: { kind: 'event', path: 'payload.values.message' },
                  transforms: ['trim'],
                },
              },
            },
          ],
        },
      },
    };

    await dispatchRuntimeComponentEvent({
      node,
      eventName: 'submit',
      event: {
        type: 'form.submit',
        sourceNodeId: 'contact-form',
        payload: {
          values: {
            message: ' Hello ',
          },
        },
      },
      dataBindings,
      actionHandlers: {
        'email.send': ({ action, resolvedPayload }) => {
          handledActionTypes.push(action.type);
          if (resolvedPayload !== undefined) handledPayloads.push(resolvedPayload);
        },
      },
    });

    expect(handledActionTypes).toEqual(['email.send']);
    expect(handledPayloads).toEqual([{ message: 'Hello' }]);
  });

  it('executes operation event bindings through the injected operation executor', async () => {
    const node: UiNode = {
      id: 'create-post-button',
      type: 'Button',
    };
    const calls: object[] = [];

    const diagnostics = await dispatchRuntimeComponentEvent({
      node,
      eventName: 'press',
      event: {
        type: 'button.press',
        sourceNodeId: 'create-post-button',
        payload: {},
      },
      dataSources: createDataSources(),
      dataBindings: {
        'create-post-button': {
          componentId: 'create-post-button',
          events: {
            press: [
              {
                target: {
                  kind: 'operation',
                  operation: {
                    dataSourceId: 'cms',
                    endpointId: 'posts',
                    operationId: 'posts.create',
                  },
                },
                input: {
                  title: { kind: 'literal', value: 'Hello' },
                },
              },
            ],
          },
        },
      },
      executeOperation: ({ input, operation }) => {
        calls.push({ input, operation });
        return Promise.resolve({ ok: true, data: { id: 'post-1' } });
      },
    });

    expect(diagnostics).toEqual([]);
    expect(calls).toEqual([
      {
        input: { title: 'Hello' },
        operation: {
          dataSourceId: 'cms',
          endpointId: 'posts',
          operationId: 'posts.create',
        },
      },
    ]);
  });

  it('stores successful operation event results under the binding operation key', async () => {
    const operation = {
      dataSourceId: 'cms',
      endpointId: 'posts',
      operationId: 'posts.list',
    };
    const writtenResults: Record<string, BindingValue> = {};

    const diagnostics = await dispatchRuntimeComponentEvent({
      node: {
        id: 'refresh-posts-button',
        type: 'Button',
      },
      eventName: 'press',
      event: {
        type: 'button.press',
        sourceNodeId: 'refresh-posts-button',
        payload: {},
      },
      dataSources: createDataSources(),
      dataBindings: {
        'refresh-posts-button': {
          componentId: 'refresh-posts-button',
          events: {
            press: [
              {
                target: {
                  kind: 'operation',
                  operation,
                },
              },
            ],
          },
        },
      },
      executeOperation: () =>
        Promise.resolve({
          ok: true,
          data: {
            items: [{ id: 'post-1', title: 'Hello' }],
          },
        }),
      writeOperationResult: (key, value) => {
        writtenResults[key] = value;
      },
    });

    expect(diagnostics).toEqual([]);
    expect(writtenResults).toEqual({
      [createRuntimeBindingOperationKey(operation)]: {
        items: [{ id: 'post-1', title: 'Hello' }],
      },
    });
  });

  it('lets subsequent prop bindings resolve from an event-populated operation result cache', async () => {
    const operation = {
      dataSourceId: 'cms',
      endpointId: 'posts',
      operationId: 'posts.list',
    };
    const operationResults: Record<string, BindingValue> = {};
    const listNode: UiNode = {
      id: 'posts-list',
      type: 'List',
    };
    const dataBindings: ComponentDataBindingRegistry = {
      'refresh-posts-button': {
        componentId: 'refresh-posts-button',
        events: {
          press: [
            {
              target: {
                kind: 'operation',
                operation,
              },
            },
          ],
        },
      },
      'posts-list': {
        componentId: 'posts-list',
        props: {
          items: {
            source: {
              kind: 'operation',
              operation,
              path: 'items',
            },
            fallback: { value: [] },
          },
        },
      },
    };

    await dispatchRuntimeComponentEvent({
      node: {
        id: 'refresh-posts-button',
        type: 'Button',
      },
      eventName: 'press',
      event: {
        type: 'button.press',
        sourceNodeId: 'refresh-posts-button',
        payload: {},
      },
      dataSources: createDataSources(),
      dataBindings,
      executeOperation: () =>
        Promise.resolve({
          ok: true,
          data: {
            items: [{ id: 'post-1', title: 'Hello' }],
          },
        }),
      writeOperationResult: (key, value) => {
        operationResults[key] = value;
      },
    });

    const result = resolveRuntimeBindings({
      node: listNode,
      props: {},
      dataBindings,
      dataSources: createDataSources(),
      operationResults,
    });

    expect(result.props).toEqual({
      items: [{ id: 'post-1', title: 'Hello' }],
    });
    expect(result.diagnostics).toEqual([]);
  });

  it('does not overwrite existing operation results when an event operation fails', async () => {
    const operation = {
      dataSourceId: 'cms',
      endpointId: 'posts',
      operationId: 'posts.list',
    };
    const operationKey = createRuntimeBindingOperationKey(operation);
    const operationResults: RuntimeBindingOperationResultCache = {
      [operationKey]: {
        items: [{ id: 'existing-post', title: 'Existing' }],
      },
    };
    const writtenResults: Record<string, BindingValue> = {};

    const diagnostics = await dispatchRuntimeComponentEvent({
      node: {
        id: 'refresh-posts-button',
        type: 'Button',
      },
      eventName: 'press',
      event: {
        type: 'button.press',
        sourceNodeId: 'refresh-posts-button',
        payload: {},
      },
      dataSources: createDataSources(),
      dataBindings: {
        'refresh-posts-button': {
          componentId: 'refresh-posts-button',
          events: {
            press: [
              {
                target: {
                  kind: 'operation',
                  operation,
                },
              },
            ],
          },
        },
      },
      executeOperation: () =>
        Promise.resolve({
          ok: false,
          diagnostics: [
            {
              code: 'adapter-error',
              dataSourceId: 'cms',
              endpointId: 'posts',
              operationId: 'posts.list',
              message: 'Network failed.',
              severity: 'error',
            },
          ],
        }),
      writeOperationResult: (key, value) => {
        writtenResults[key] = value;
      },
    });

    expect(diagnostics.map((diagnostic) => diagnostic.code)).toEqual(['adapter-error']);
    expect(writtenResults).toEqual({});
    expect(operationResults[operationKey]).toEqual({
      items: [{ id: 'existing-post', title: 'Existing' }],
    });
  });

  it('executes chained scanner bindings using dispatch-scoped operation results', async () => {
    const operation = {
      dataSourceId: 'cms',
      endpointId: 'posts',
      operationId: 'posts.list',
    };
    const executedActions: { type: string; payload?: object }[] = [];
    const operationInputs: object[] = [];

    const diagnostics = await dispatchRuntimeComponentEvent({
      node: {
        id: 'scanner',
        type: 'BarcodeScannerView',
      },
      eventName: 'barcodeScanned',
      event: {
        type: 'barcodeScanned',
        sourceNodeId: 'scanner',
        payload: {
          value: '7612345678901',
          type: 'ean13',
        },
      },
      dataSources: createDataSources(),
      dataBindings: {
        scanner: {
          componentId: 'scanner',
          events: {
            barcodeScanned: [
              {
                target: {
                  kind: 'operation',
                  operation,
                },
                input: {
                  barcode: {
                    kind: 'source',
                    source: { kind: 'event', path: 'payload.value' },
                  },
                },
              },
              {
                target: {
                  kind: 'action',
                  type: 'navigate',
                },
                when: {
                  source: {
                    kind: 'operation',
                    operation,
                    path: 'product.id',
                  },
                  operator: 'exists',
                },
                input: {
                  route: { kind: 'literal', value: '/products/[id]' },
                  params: {
                    kind: 'object',
                    fields: {
                      id: {
                        kind: 'source',
                        source: {
                          kind: 'operation',
                          operation,
                          path: 'product.id',
                        },
                      },
                    },
                  },
                },
              },
              {
                target: {
                  kind: 'action',
                  type: 'navigate',
                },
                when: {
                  source: {
                    kind: 'operation',
                    operation,
                    path: 'product.id',
                  },
                  operator: 'notExists',
                },
                input: {
                  route: { kind: 'literal', value: '/products/create' },
                  params: {
                    kind: 'object',
                    fields: {
                      barcode: {
                        kind: 'source',
                        source: { kind: 'event', path: 'payload.value' },
                      },
                    },
                  },
                },
              },
            ],
          },
        },
      },
      executeAction: ({ action }) => {
        executedActions.push(action);
      },
      executeOperation: ({ input }) => {
        operationInputs.push(input as object);
        return Promise.resolve({
          ok: true,
          data: {
            product: { id: 'post-1' },
          },
        });
      },
    });

    expect(diagnostics).toEqual([]);
    expect(operationInputs).toEqual([{ barcode: '7612345678901' }]);
    expect(executedActions).toEqual([
      {
        type: 'navigate',
        payload: {
          route: '/products/[id]',
          params: { id: 'post-1' },
        },
      },
    ]);
  });

  it('navigates to create when the scanner lookup result is missing', async () => {
    const operation = {
      dataSourceId: 'cms',
      endpointId: 'posts',
      operationId: 'posts.list',
    };
    const executedActions: { type: string; payload?: object }[] = [];

    const diagnostics = await dispatchRuntimeComponentEvent({
      node: {
        id: 'scanner',
        type: 'BarcodeScannerView',
      },
      eventName: 'barcodeScanned',
      event: {
        type: 'barcodeScanned',
        sourceNodeId: 'scanner',
        payload: {
          value: '7612345678901',
        },
      },
      dataSources: createDataSources(),
      dataBindings: {
        scanner: {
          componentId: 'scanner',
          events: {
            barcodeScanned: [
              {
                target: {
                  kind: 'operation',
                  operation,
                },
              },
              {
                target: {
                  kind: 'action',
                  type: 'navigate',
                },
                when: {
                  source: {
                    kind: 'operation',
                    operation,
                    path: 'product.id',
                  },
                  operator: 'notExists',
                },
                input: {
                  route: { kind: 'literal', value: '/products/create' },
                  params: {
                    kind: 'object',
                    fields: {
                      barcode: {
                        kind: 'source',
                        source: { kind: 'event', path: 'payload.value' },
                      },
                    },
                  },
                },
              },
            ],
          },
        },
      },
      executeAction: ({ action }) => {
        executedActions.push(action);
      },
      executeOperation: () =>
        Promise.resolve({
          ok: true,
          data: {},
        }),
    });

    expect(diagnostics).toEqual([]);
    expect(executedActions).toEqual([
      {
        type: 'navigate',
        payload: {
          route: '/products/create',
          params: { barcode: '7612345678901' },
        },
      },
    ]);
  });

  it('stops scanner follow-up bindings when the lookup operation fails', async () => {
    const operation = {
      dataSourceId: 'cms',
      endpointId: 'posts',
      operationId: 'posts.list',
    };
    const executedActions: { type: string; payload?: object }[] = [];

    const diagnostics = await dispatchRuntimeComponentEvent({
      node: {
        id: 'scanner',
        type: 'BarcodeScannerView',
      },
      eventName: 'barcodeScanned',
      event: {
        type: 'barcodeScanned',
        sourceNodeId: 'scanner',
        payload: {
          value: '7612345678901',
        },
      },
      dataSources: createDataSources(),
      dataBindings: {
        scanner: {
          componentId: 'scanner',
          events: {
            barcodeScanned: [
              {
                target: {
                  kind: 'operation',
                  operation,
                },
              },
              {
                target: {
                  kind: 'action',
                  type: 'navigate',
                },
                when: {
                  source: {
                    kind: 'operation',
                    operation,
                    path: 'product.id',
                  },
                  operator: 'notExists',
                },
                input: {
                  route: { kind: 'literal', value: '/products/create' },
                  params: {
                    kind: 'object',
                    fields: {
                      barcode: {
                        kind: 'source',
                        source: { kind: 'event', path: 'payload.value' },
                      },
                    },
                  },
                },
              },
            ],
          },
        },
      },
      executeAction: ({ action }) => {
        executedActions.push(action);
      },
      executeOperation: () =>
        Promise.resolve({
          ok: false,
          diagnostics: [
            {
              code: 'adapter-error',
              dataSourceId: 'cms',
              endpointId: 'posts',
              operationId: 'posts.list',
              message: 'Lookup failed.',
              severity: 'error',
            },
          ],
        }),
    });

    expect(diagnostics).toEqual([
      {
        code: 'adapter-error',
        dataSourceId: 'cms',
        endpointId: 'posts',
        operationId: 'posts.list',
        message: 'Lookup failed.',
        severity: 'error',
      },
    ]);
    expect(executedActions).toEqual([]);
  });

  it('returns a diagnostic when an action binding has no executor', async () => {
    const diagnostics = await dispatchRuntimeComponentEvent({
      node: {
        id: 'save-button',
        type: 'Button',
      },
      eventName: 'press',
      event: {
        type: 'button.press',
        sourceNodeId: 'save-button',
        payload: {},
      },
      dataBindings: {
        'save-button': {
          componentId: 'save-button',
          events: {
            press: [{ target: { kind: 'action', type: 'missing.action' } }],
          },
        },
      },
    });

    expect(diagnostics).toEqual([
      {
        code: 'missing-action-handler',
        message:
          "Action 'missing.action' could not be executed because no runtime executor or handler is registered.",
        severity: 'error',
      },
    ]);
  });

  it('creates canonical component events from handler args', () => {
    const node: UiNode = {
      id: 'contact-form',
      type: 'Form',
    };

    const event = createComponentEventFromHandlerArgs({
      node,
      eventName: 'submit',
      handlerArgs: [
        {
          message: 'Hello',
        },
      ],
    });

    expect(event).toEqual({
      type: 'form.submit',
      sourceNodeId: 'contact-form',
      payload: {
        values: {
          message: 'Hello',
        },
      },
    });
  });

  it('creates canonical scanner component events from handler args', () => {
    const node: UiNode = {
      id: 'scanner',
      type: 'BarcodeScannerView',
    };

    const event = createComponentEventFromHandlerArgs({
      node,
      eventName: 'barcodeScanned',
      handlerArgs: [{ value: '7612345678901', type: 'ean13' }],
    });

    expect(event).toEqual({
      type: 'barcodeScanned',
      sourceNodeId: 'scanner',
      payload: {
        value: '7612345678901',
        type: 'ean13',
      },
    });
  });

  it('wraps event props from component data bindings and preserves existing handlers', () => {
    const calls: string[] = [];
    const node: UiNode = {
      id: 'save-button',
      type: 'Button',
    };

    const props = wrapRuntimeEventProps({
      node,
      dataBindings: {
        'save-button': {
          componentId: 'save-button',
          events: {
            press: [{ target: { kind: 'action', type: 'console' } }],
          },
        },
      },
      props: {
        onPress: () => {
          calls.push('existing');
        },
      },
      disableActions: false,
      dispatchComponentEvent: ({ event }) => {
        calls.push(event.type);
      },
    });

    const { onPress } = props;
    if (!isNoArgFunction(onPress)) {
      throw new TypeError('Expected onPress to be a function.');
    }

    onPress();

    expect(calls).toEqual(['existing', 'button.press']);
  });

  it('supports registering action handlers imperatively with component data bindings', async () => {
    const handled: string[] = [];
    const registry = createRuntimeActionRegistry({
      dataBindings: {
        'save-button': {
          componentId: 'save-button',
          events: {
            press: [{ target: { kind: 'action', type: 'console' } }],
          },
        },
      },
    });
    const unregister = registry.registerActionHandler('console', ({ action }) => {
      handled.push(action.type);
    });

    await registry.dispatchComponentEvent({
      node: {
        id: 'save-button',
        type: 'Button',
      },
      eventName: 'press',
      event: {
        type: 'button.press',
        sourceNodeId: 'save-button',
        payload: {},
      },
    });
    unregister();
    await registry.dispatchComponentEvent({
      node: {
        id: 'save-button',
        type: 'Button',
      },
      eventName: 'press',
      event: {
        type: 'button.press',
        sourceNodeId: 'save-button',
        payload: {},
      },
    });

    expect(handled).toEqual(['console']);
  });
});
