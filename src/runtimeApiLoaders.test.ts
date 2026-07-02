import type { AppDataManifest, ComponentDataBindingRegistry, UiNode } from '@ankhorage/contracts';
import { describe, expect, it } from 'bun:test';

import {
  executeRuntimeApiLoaders,
  materializeRuntimeApiLoaderState,
  type RuntimeApiLoaderDefinition,
} from './runtimeApiLoaders';
import { resolveRuntimeBindings } from './runtimeBindings';
import { createRuntimeMemoryStateAdapter } from './runtimeStateAdapter';

const dataManifest: AppDataManifest = {
  apis: {
    poker_situations: {
      id: 'poker_situations',
      kind: 'generated',
      label: 'Poker situations',
      basePath: '/api/poker-situations',
      preset: 'crud',
      resource: {
        kind: 'collection',
        collection: {
          name: 'poker_situations',
          primaryKey: 'id',
          fields: [
            { name: 'id', type: 'uuid', required: true, unique: true },
            { name: 'title', type: 'text', required: true },
            { name: 'description', type: 'text', required: true },
          ],
        },
        seed: [
          {
            id: '11111111-1111-4111-8111-111111111111',
            title: 'Button faces a raise',
            description: 'Choose the best action with position and stack depth in mind.',
          },
        ],
      },
      endpoints: [
        { id: 'poker_situations.list', method: 'GET', path: '/', intent: 'list' },
        { id: 'poker_situations.read', method: 'GET', path: '/{id}', intent: 'read' },
      ],
    },
  },
};

const currentTaskLoader: RuntimeApiLoaderDefinition = {
  kind: 'api',
  apiId: 'poker_situations',
  mode: 'one',
  targetPath: 'apis.poker_situations.current',
};

const titleNode: UiNode = {
  id: 'title',
  type: 'Text',
  props: {
    text: 'Fallback',
  },
};

const titleBinding: ComponentDataBindingRegistry = {
  title: {
    componentId: 'title',
    props: {
      text: {
        source: {
          kind: 'state',
          path: 'apis.poker_situations.current.title',
        },
      },
    },
  },
};

describe('runtime API loaders', () => {
  it('materializes one API seed record into nested state', () => {
    expect(
      materializeRuntimeApiLoaderState({
        data: dataManifest,
        loaders: [currentTaskLoader],
      }),
    ).toEqual({
      diagnostics: [],
      state: {
        apis: {
          poker_situations: {
            current: {
              id: '11111111-1111-4111-8111-111111111111',
              title: 'Button faces a raise',
              description: 'Choose the best action with position and stack depth in mind.',
            },
          },
        },
      },
    });
  });

  it('writes API loader output through a StateAdapter', () => {
    const stateAdapter = createRuntimeMemoryStateAdapter();

    expect(
      executeRuntimeApiLoaders({
        data: dataManifest,
        loaders: [currentTaskLoader],
        stateAdapter,
      }),
    ).toEqual({ diagnostics: [] });

    expect(stateAdapter.get('apis.poker_situations.current.title')).toEqual({
      ok: true,
      data: 'Button faces a raise',
    });
  });

  it('allows state bindings to read API loader output', () => {
    const stateAdapter = createRuntimeMemoryStateAdapter();
    executeRuntimeApiLoaders({
      data: dataManifest,
      loaders: [currentTaskLoader],
      stateAdapter,
    });

    expect(
      resolveRuntimeBindings({
        dataBindings: titleBinding,
        node: titleNode,
        props: titleNode.props ?? {},
        stateAdapter,
      }),
    ).toEqual({
      diagnostics: [],
      props: {
        text: 'Button faces a raise',
      },
    });
  });
});
