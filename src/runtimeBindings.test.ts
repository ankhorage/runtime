import type {
  BindingInputMap,
  ComponentDataBindingRegistry,
  DataSourceDiagnostic,
  DataSourceRegistry,
  StateAdapter,
  StatePath,
  StateResult,
  StateSubscription,
  StateValue,
  UiNode,
} from '@ankhorage/contracts';
import { describe, expect, it } from 'bun:test';

import {
  createRuntimeBindingOperationKey,
  resolveBindingInputMapSync,
  resolveRuntimeBindings,
  resolveRuntimeBindingsAsync,
  resolveRuntimeBindingValue,
  validateRuntimeBindingOperationRef,
} from './runtimeBindings';
import { resolveRuntimeNodeProps } from './runtimeNodeProps';

function createFakeStateAdapter(values: Record<string, StateValue>): StateAdapter {
  return {
    capabilities: {
      subscriptions: true,
      computed: false,
      persistence: false,
    },
    get<TValue extends StateValue = StateValue>(path: StatePath): StateResult<TValue | undefined> {
      const key = typeof path === 'string' ? path : path.join('.');
      return { ok: true, data: values[key] as TValue | undefined } as StateResult<
        TValue | undefined
      >;
    },
    set(): StateResult {
      return { ok: true };
    },
    subscribe(): StateResult<StateSubscription> {
      return {
        ok: true,
        data: {
          unsubscribe() {
            return undefined;
          },
        },
      };
    },
    delete(): StateResult {
      return { ok: true };
    },
  };
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
  };
}

describe('resolveRuntimeBindings', () => {
  it('resolves literal component data bindings as plain props', () => {
    const node: UiNode = {
      id: 'headline',
      type: 'Text',
      props: {
        text: 'fallback',
      },
    };
    const dataBindings: ComponentDataBindingRegistry = {
      headline: {
        componentId: 'headline',
        componentType: 'Text',
        props: {
          text: {
            source: {
              kind: 'literal',
              value: 'Bound headline',
            },
          },
        },
      },
    };

    expect(resolveRuntimeBindings({ node, props: node.props ?? {}, dataBindings }).props).toEqual({
      text: 'Bound headline',
    });
  });

  it('lets component data bindings override manifest props before custom prop resolvers run', () => {
    const node: UiNode = {
      id: 'headline',
      type: 'Text',
      props: {
        text: 'fallback',
      },
    };

    const props = resolveRuntimeNodeProps({
      node,
      dataBindings: {
        headline: {
          componentId: 'headline',
          props: {
            text: {
              source: { kind: 'literal', value: 'bound' },
            },
          },
        },
      },
      resolveNodeProps: ({ props }) => ({
        ...props,
        text: `${String(props.text)}!`,
      }),
    });

    expect(props).toEqual({
      testID: 'headline',
      text: 'bound!',
    });
  });

  it('resolves context path bindings', () => {
    const node: UiNode = {
      id: 'profile-name',
      type: 'Text',
    };

    expect(
      resolveRuntimeBindings({
        node,
        props: {},
        dataBindings: {
          'profile-name': {
            componentId: 'profile-name',
            props: {
              text: {
                source: { kind: 'context', path: 'auth.user.displayName' },
              },
            },
          },
        },
        context: {
          auth: {
            user: {
              displayName: 'Fabio',
            },
          },
        },
      }).props,
    ).toEqual({ text: 'Fabio' });
  });

  it('resolves state path bindings through the configured state adapter', () => {
    const node: UiNode = {
      id: 'firstname-input',
      type: 'Input',
    };

    expect(
      resolveRuntimeBindings({
        node,
        props: {},
        dataBindings: {
          'firstname-input': {
            componentId: 'firstname-input',
            props: {
              value: {
                source: { kind: 'state', path: 'forms.contact.values.firstname' },
                transforms: ['trim'],
              },
            },
          },
        },
        stateAdapter: createFakeStateAdapter({
          'forms.contact.values.firstname': ' Fabio ',
        }),
      }).props,
    ).toEqual({ value: 'Fabio' });
  });

  it('resolves operation props from preloaded operation results during synchronous rendering', () => {
    const node: UiNode = {
      id: 'posts-list',
      type: 'List',
    };
    const operation = {
      dataSourceId: 'cms',
      endpointId: 'posts',
      operationId: 'posts.list',
    };

    expect(
      resolveRuntimeBindings({
        node,
        props: {},
        dataSources: createDataSources(),
        dataBindings: {
          'posts-list': {
            componentId: 'posts-list',
            props: {
              items: {
                source: { kind: 'operation', operation, path: 'items' },
              },
            },
          },
        },
        operationResults: {
          [createRuntimeBindingOperationKey(operation)]: {
            items: [{ id: 'post-1', title: 'Hello' }],
          },
        },
      }).props,
    ).toEqual({ items: [{ id: 'post-1', title: 'Hello' }] });
  });

  it('returns diagnostics for operation props without preloaded results in synchronous rendering', () => {
    const node: UiNode = {
      id: 'posts-list',
      type: 'List',
    };

    const result = resolveRuntimeBindings({
      node,
      props: {},
      dataSources: createDataSources(),
      dataBindings: {
        'posts-list': {
          componentId: 'posts-list',
          props: {
            items: {
              source: {
                kind: 'operation',
                operation: {
                  dataSourceId: 'cms',
                  endpointId: 'posts',
                  operationId: 'posts.list',
                },
              },
              fallback: { value: [] },
            },
          },
        },
      },
    });

    expect(result.props).toEqual({ items: [] });
    expect(result.diagnostics.map((diagnostic) => diagnostic.code)).toContain('missing-adapter');
  });
});

describe('resolveRuntimeBindingsAsync', () => {
  it('executes operation prop bindings through the injected operation executor', async () => {
    const node: UiNode = {
      id: 'posts-list',
      type: 'List',
    };
    const calls: string[] = [];

    const result = await resolveRuntimeBindingsAsync({
      node,
      props: {},
      dataSources: createDataSources(),
      dataBindings: {
        'posts-list': {
          componentId: 'posts-list',
          props: {
            items: {
              source: {
                kind: 'operation',
                operation: {
                  dataSourceId: 'cms',
                  endpointId: 'posts',
                  operationId: 'posts.list',
                },
                path: 'items',
              },
            },
          },
        },
      },
      executeOperation: ({ operation }) => {
        calls.push(operation.operationId);
        return Promise.resolve({
          ok: true,
          data: {
            items: [{ id: 'post-1', title: 'Hello' }],
          },
        });
      },
    });

    expect(calls).toEqual(['posts.list']);
    expect(result.props).toEqual({ items: [{ id: 'post-1', title: 'Hello' }] });
    expect(result.diagnostics).toEqual([]);
  });

  it('resolves direct async binding values', async () => {
    const value = await resolveRuntimeBindingValue(
      {
        source: {
          kind: 'literal',
          value: ' hello ',
        },
        transforms: ['trim', 'uppercase'],
      },
      {},
    );

    expect(value).toBe('HELLO');
  });
});

describe('validateRuntimeBindingOperationRef', () => {
  it('returns deterministic diagnostics for missing operation references', () => {
    expect(
      validateRuntimeBindingOperationRef(
        {
          dataSourceId: 'cms',
          endpointId: 'posts',
          operationId: 'posts.missing',
        },
        createDataSources(),
      ),
    ).toEqual([
      {
        code: 'missing-operation',
        dataSourceId: 'cms',
        endpointId: 'posts',
        operationId: 'posts.missing',
        message: "Operation 'posts.missing' could not be found.",
        severity: 'error',
      },
    ]);
  });
});

describe('resolveBindingInputMapSync', () => {
  it('resolves nested input values synchronously without executing operations', () => {
    const operation = {
      dataSourceId: 'cms',
      endpointId: 'posts',
      operationId: 'posts.list',
    };
    const input: BindingInputMap = {
      filters: {
        kind: 'object',
        fields: {
          query: {
            kind: 'source',
            source: {
              kind: 'context',
              path: 'search.query',
            },
            transforms: ['trim'],
          },
          tags: {
            kind: 'array',
            items: [
              {
                kind: 'literal',
                value: 'featured',
              },
              {
                kind: 'source',
                source: {
                  kind: 'operation',
                  operation,
                  path: 'filters.tag',
                },
              },
            ],
          },
        },
      },
      published: {
        kind: 'source',
        source: {
          kind: 'state',
          path: 'forms.posts.values.published',
        },
      },
    };

    const diagnostics: DataSourceDiagnostic[] = [];

    expect(
      resolveBindingInputMapSync(
        input,
        {
          context: {
            search: {
              query: ' hello ',
            },
          },
          operationResults: {
            [createRuntimeBindingOperationKey(operation)]: {
              filters: {
                tag: 'news',
              },
            },
          },
          stateAdapter: createFakeStateAdapter({
            'forms.posts.values.published': true,
          }),
        },
        diagnostics,
      ),
    ).toEqual({
      filters: {
        query: 'hello',
        tags: ['featured', 'news'],
      },
      published: true,
    });
    expect(diagnostics).toEqual([]);
  });

  it('returns undefined for uncached operation input sources and does not require an executor', () => {
    const diagnostics: DataSourceDiagnostic[] = [];

    expect(
      resolveBindingInputMapSync(
        {
          itemId: {
            kind: 'source',
            source: {
              kind: 'operation',
              operation: {
                dataSourceId: 'cms',
                endpointId: 'posts',
                operationId: 'posts.list',
              },
              path: 'items.0.id',
            },
          },
        },
        {},
        diagnostics,
      ),
    ).toEqual({});
    expect(diagnostics.map((diagnostic) => diagnostic.code)).toEqual(['missing-adapter']);
  });
});
