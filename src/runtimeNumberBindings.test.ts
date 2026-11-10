import type { ComponentDataBindingRegistry } from '@ankhorage/contracts';
import { expect, it } from 'bun:test';

import { dispatchRuntimeComponentEvent } from './runtimeActionRegistry';
import { composeRuntimeCapabilityExecutor } from './runtimeCapabilityExecutor';
import { createRuntimeMemoryStateAdapter } from './runtimeStateAdapter';

it('persists a number-transformed field through the existing state.set capability', async () => {
  const stateAdapter = createRuntimeMemoryStateAdapter();
  const executeCapability = composeRuntimeCapabilityExecutor({
    apiCapabilityExecutor: () => Promise.resolve({ data: {}, ok: true as const }),
    stateAdapter,
  });
  const bindings: ComponentDataBindingRegistry = {
    'board-controls': {
      componentId: 'board-controls',
      events: {
        valueChange: [
          {
            target: {
              capability: 'state.set',
              input: {
                path: { kind: 'literal', value: 'board.columns' },
                value: {
                  kind: 'transform',
                  transforms: ['trim', 'number'],
                  value: { capability: 'select.valueChange', path: 'payload.columns' },
                },
              },
            },
          },
        ],
      },
    },
  };

  const diagnostics = await dispatchRuntimeComponentEvent({
    dataBindings: bindings,
    event: {
      payload: { columns: ' 10 ' },
      sourceNodeId: 'board-controls',
      type: 'select.valueChange',
    },
    executeCapability,
    node: { id: 'board-controls', type: 'Select' },
  });

  expect(diagnostics).toEqual([]);
  expect(stateAdapter.get('board.columns')).toEqual({ data: 10, ok: true });
});
