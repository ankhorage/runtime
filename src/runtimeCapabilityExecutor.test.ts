import type { ComponentDataBindingRegistry, ScreenSpec, UiNode } from '@ankhorage/contracts';
import { expect, it } from 'bun:test';

import { dispatchRuntimeComponentEvent } from './runtimeActionRegistry';
import { composeRuntimeCapabilityExecutor } from './runtimeCapabilityExecutor';
import { resolveRuntimeNodeProps } from './runtimeNodeProps';
import { executeRuntimeScreenOperationLoaders } from './runtimeScreenLoaders';
import { createRuntimeMemoryStateAdapter } from './runtimeStateAdapter';

const node: UiNode = { id: 'root', type: 'View' };

it('keeps manifest API execution while delegating application capabilities in one loader configuration', async () => {
  const calls: string[] = [];
  const executeCapability = composeRuntimeCapabilityExecutor({
    apiCapabilityExecutor: ({ capability }) => {
      calls.push(`api:${capability}`);
      return Promise.resolve({ data: { source: 'data-operation' }, ok: true as const });
    },
    capabilityExecutor: ({ capability }) => {
      calls.push(`application:${capability}`);
      return Promise.resolve({ data: { source: 'application' }, ok: true as const });
    },
  });
  const screen = {
    dataLoaders: [
      { capability: 'navigator.navigate', result: 'navigation' },
      { capability: 'api.catalog.list', result: 'catalog' },
    ],
    id: 'screen',
    name: 'Screen',
    root: node,
  } as ScreenSpec;

  const result = await executeRuntimeScreenOperationLoaders({
    executeCapability,
    loaders: screen.dataLoaders ?? [],
    screen,
  });

  expect(calls).toEqual(['application:navigator.navigate', 'api:api.catalog.list']);
  expect(result.resultSlots).toEqual({
    catalog: { source: 'data-operation' },
    navigation: { source: 'application' },
  });
});

it('persists a state.set mutation for a later screen presentation binding', async () => {
  const stateAdapter = createRuntimeMemoryStateAdapter({
    initialState: { day: { meals: ['Breakfast'], summary: '1 meal logged' } },
  });
  const executeCapability = composeRuntimeCapabilityExecutor({
    apiCapabilityExecutor: () => Promise.resolve({ data: {}, ok: true as const }),
    stateAdapter,
  });
  const bindings: ComponentDataBindingRegistry = {
    'log-meal': {
      componentId: 'log-meal',
      events: {
        press: [
          {
            target: {
              capability: 'state.set',
              input: {
                path: { kind: 'literal', value: 'day' },
                value: {
                  kind: 'literal',
                  value: { meals: ['Breakfast', 'Berry oats'], summary: '2 meals logged' },
                },
              },
            },
          },
        ],
      },
    },
    'home-summary': {
      componentId: 'home-summary',
      props: {
        value: { value: { capability: 'state.day', path: 'summary' } },
      },
    },
  };

  const diagnostics = await dispatchRuntimeComponentEvent({
    dataBindings: bindings,
    event: { payload: {}, sourceNodeId: 'log-meal', type: 'button.press' },
    executeCapability,
    node: { id: 'log-meal', type: 'Button' },
  });
  const laterScreenProps = resolveRuntimeNodeProps({
    dataBindings: bindings,
    node: { id: 'home-summary', type: 'MetricCard', props: { value: 'stale' } },
    stateAdapter,
  });

  expect(diagnostics).toEqual([]);
  expect(laterScreenProps.value).toBe('2 meals logged');
});

it('reports invalid state.set input without delegating to an application executor', async () => {
  const executeCapability = composeRuntimeCapabilityExecutor({
    apiCapabilityExecutor: () => Promise.resolve({ data: {}, ok: true as const }),
    capabilityExecutor: () => Promise.resolve({ data: {}, ok: true as const }),
    stateAdapter: createRuntimeMemoryStateAdapter(),
  });

  const result = await executeCapability({
    capability: 'state.set',
    input: { path: '' },
  });

  expect(result).toEqual({
    diagnostics: [
      {
        code: 'invalid-input',
        message: "Capability 'state.set' requires a non-empty path and serializable value.",
        severity: 'error',
      },
    ],
    ok: false,
  });
});
