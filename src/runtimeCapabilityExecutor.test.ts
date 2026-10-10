import type { ScreenSpec, UiNode } from '@ankhorage/contracts';
import { expect, it } from 'bun:test';

import { composeRuntimeCapabilityExecutor } from './runtimeCapabilityExecutor';
import { executeRuntimeScreenOperationLoaders } from './runtimeScreenLoaders';

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
