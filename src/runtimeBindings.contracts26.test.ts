import type {
  BindingExpression,
  BindingValue,
  ComponentDataBindingRegistry,
  ScreenSpec,
  UiNode,
} from '@ankhorage/contracts';
import { expect, it } from 'bun:test';

import { dispatchRuntimeComponentEvent } from './runtimeActionRegistry';
import {
  executeRuntimeBindingInvocation,
  resolveRuntimeBindingExpression,
  resolveRuntimeBindingExpressionSync,
} from './runtimeBindings';
import { resolveRuntimeRepeatItemsAsync } from './runtimeRepeat';
import { executeRuntimeScreenOperationLoaders } from './runtimeScreenLoaders';

const node: UiNode = { id: 'root', type: 'View' };

it('resolves literals, nested values, transforms, fallbacks, and readable capability paths', async () => {
  const expression: BindingExpression = {
    kind: 'object',
    fields: {
      fallback: {
        fallback: { capability: 'context.missing' },
        kind: 'fallback',
        value: { kind: 'literal', value: 'fallback' },
      },
      values: {
        items: [
          { capability: 'context.user', path: 'name' },
          {
            kind: 'transform',
            transforms: ['trim', 'uppercase'],
            value: { kind: 'literal', value: ' hi ' },
          },
        ],
        kind: 'array',
      },
    },
  };
  expect(
    await resolveRuntimeBindingExpression(expression, { context: { user: { name: 'Ada' } } }),
  ).toEqual({
    fallback: 'fallback',
    values: ['Ada', 'HI'],
  });
});

it('stores named invocation results and reads them without executing again', async () => {
  const slots: Record<string, BindingValue | undefined> = {};
  let calls = 0;
  const executeCapability = () => {
    calls += 1;
    return Promise.resolve({ data: { result: { id: 'first' } }, ok: true as const });
  };
  await executeRuntimeBindingInvocation(
    { capability: 'products.load', result: 'loaded' },
    {
      executeCapability,
      resultSlots: slots,
      writeResultSlot: (slot, value) => {
        if (slot === 'loaded') slots.loaded = value;
      },
    },
    { node },
  );
  expect(
    resolveRuntimeBindingExpressionSync(
      { capability: 'products.load', path: 'result.id', result: 'loaded' },
      { resultSlots: slots },
    ),
  ).toBe('first');
  expect(calls).toBe(1);
});

it('keeps distinct slots for repeated calls to the same capability', async () => {
  const slots: Record<string, BindingValue | undefined> = {};
  let calls = 0;
  const executeCapability = () => Promise.resolve({ data: { call: ++calls }, ok: true as const });
  const context = {
    executeCapability,
    resultSlots: slots,
    writeResultSlot: (slot: string, value: BindingValue) => {
      if (slot === 'one') slots.one = value;
      if (slot === 'two') slots.two = value;
    },
  };
  await executeRuntimeBindingInvocation({ capability: 'products.load', result: 'one' }, context, {
    node,
  });
  await executeRuntimeBindingInvocation({ capability: 'products.load', result: 'two' }, context, {
    node,
  });
  expect(slots).toEqual({ one: { call: 1 }, two: { call: 2 } });
});

it('uses capability invocation for events, repeats, and screen loaders', async () => {
  const slots: Record<string, BindingValue | undefined> = {};
  const executeCapability = ({ capability }: { readonly capability: string }) =>
    Promise.resolve({
      data: capability === 'items.read' ? [{ id: 'a' }] : { ok: true },
      ok: true as const,
    });
  const bindings: ComponentDataBindingRegistry = {
    root: {
      componentId: 'root',
      events: { press: [{ target: { capability: 'form.submit', result: 'submission' } }] },
    },
  };
  await dispatchRuntimeComponentEvent({
    dataBindings: bindings,
    event: { payload: {}, sourceNodeId: 'root', type: 'button.press' },
    executeCapability,
    node,
    resultSlots: slots,
    writeResultSlot: (slot, value) => {
      if (slot === 'submission') slots.submission = value;
    },
  });
  const repeat = await resolveRuntimeRepeatItemsAsync(
    { source: { capability: 'items.read' } },
    { executeCapability, node },
  );
  const screen = {
    id: 'screen',
    name: 'Screen',
    root: node,
    dataLoaders: [{ capability: 'items.read', result: 'items' }],
  } as ScreenSpec;
  const loaders = await executeRuntimeScreenOperationLoaders({
    executeCapability,
    loaders: screen.dataLoaders ?? [],
    screen,
  });
  expect(slots.submission).toEqual({ ok: true });
  expect(repeat.items).toEqual([{ id: 'a' }]);
  expect(loaders.resultSlots.items).toEqual([{ id: 'a' }]);
});
