import type {
  ComponentDataBindingRegistry,
  ScreenSpec,
  StateAdapter,
  UiNode,
} from '@ankhorage/contracts';
import { expect, it } from 'bun:test';

import { dispatchRuntimeComponentEvent } from './runtimeActionRegistry';
import { composeRuntimeCapabilityExecutor } from './runtimeCapabilityExecutor';
import { resolveRuntimeNodeProps } from './runtimeNodeProps';
import { executeRuntimeScreenOperationLoaders } from './runtimeScreenLoaders';
import { createRuntimeMemoryStateAdapter } from './runtimeStateAdapter';

const node: UiNode = { id: 'root', type: 'View' };

it('prefers the configured executor for API capabilities while delegating application capabilities', async () => {
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

  expect(calls).toEqual(['application:navigator.navigate', 'application:api.catalog.list']);
  expect(result.resultSlots).toEqual({
    catalog: { source: 'application' },
    navigation: { source: 'application' },
  });
});

it('falls back to manifest API execution when no configured executor is available', async () => {
  const executeCapability = composeRuntimeCapabilityExecutor({
    apiCapabilityExecutor: () =>
      Promise.resolve({ data: { source: 'data-operation' }, ok: true as const }),
  });

  const result = await executeCapability({ capability: 'api.catalog.list' });

  expect(result).toEqual({
    data: { source: 'data-operation' },
    ok: true,
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

it('rejects non-finite state values without delegating to an application executor', async () => {
  const executeCapability = composeRuntimeCapabilityExecutor({
    apiCapabilityExecutor: () => Promise.resolve({ data: {}, ok: true as const }),
    capabilityExecutor: () => Promise.resolve({ data: {}, ok: true as const }),
    stateAdapter: createRuntimeMemoryStateAdapter(),
  });

  for (const value of [
    Number.NaN,
    Number.POSITIVE_INFINITY,
    { nested: Number.NEGATIVE_INFINITY },
  ]) {
    const result = await executeCapability({
      capability: 'state.set',
      input: { path: 'value', value },
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
  }
});

it('returns a structured failure when StateAdapter.set throws', async () => {
  const stateAdapter = {
    capabilities: { computed: false, persistence: false, subscriptions: false },
    get: () => ({ data: undefined, ok: true as const }),
    set: () => {
      throw new Error('Storage is unavailable.');
    },
    subscribe: () => ({ data: { unsubscribe: () => undefined }, ok: true as const }),
  } satisfies StateAdapter;
  const executeCapability = composeRuntimeCapabilityExecutor({
    apiCapabilityExecutor: () => Promise.resolve({ data: {}, ok: true as const }),
    stateAdapter,
  });

  const result = await executeCapability({
    capability: 'state.set',
    input: { path: 'value', value: 'Updated' },
  });
  expect(result).toEqual({
    diagnostics: [
      { code: 'state-adapter-error', message: 'Storage is unavailable.', severity: 'error' },
    ],
    ok: false,
  });
});
