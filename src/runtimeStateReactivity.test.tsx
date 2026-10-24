import type { ComponentDataBindingRegistry, UiNode } from '@ankhorage/contracts';
import { describe, expect, it, mock } from 'bun:test';
import React from 'react';
import { act, create } from 'react-test-renderer';

import type { ComponentRegistry } from './registry';
import type {
  RuntimeCapabilityExecutionArgs,
  RuntimeCapabilityExecutionResult,
} from './runtimeBindings';
import { createRuntimeMemoryStateAdapter } from './runtimeStateAdapter';

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

void mock.module('react-native', () => ({
  StyleSheet: { create: <TStyles,>(styles: TStyles): TStyles => styles },
  Text: 'text',
  View: 'view',
}));

const { RuntimeRenderer } = await import('./RuntimeRenderer');

const ValueProbe = ({ value }: { readonly value?: unknown }): React.ReactElement => (
  <output>{String(value)}</output>
);

const ListProbe = ({ children }: { readonly children?: React.ReactNode }): React.ReactElement => (
  <output data-kind="list">{children}</output>
);

const ItemProbe = (): React.ReactElement => <output data-kind="item" />;

const asyncRepeatNode = {
  children: [{ id: 'meal', type: 'ItemProbe' }],
  id: 'meals',
  repeat: {
    itemAlias: 'meal',
    source: { capability: 'api.meals.list' },
  },
  type: 'ListProbe',
} satisfies UiNode;

const registry: ComponentRegistry = {
  ItemProbe,
  ListProbe,
  ValueProbe,
};

function mountAsyncRepeat(
  bindingContext: Record<string, unknown>,
  executeCapability: ReturnType<typeof mock>,
): ReturnType<typeof create> {
  let renderer: ReturnType<typeof create> | undefined;

  act(() => {
    renderer = create(
      <RuntimeRenderer
        bindingContext={bindingContext}
        executeCapability={executeCapability}
        isRoot
        node={asyncRepeatNode}
        registry={registry}
      />,
    );
  });
  if (renderer === undefined) throw new Error('Expected mounted RuntimeRenderer.');

  return renderer;
}

describe('Runtime state binding reactivity', () => {
  it('rerenders a mounted state binding for nested writes and ancestor replacements', () => {
    const stateAdapter = createRuntimeMemoryStateAdapter({
      initialState: { day: { summary: 'One meal' } },
    });
    const node = { id: 'summary', type: 'ValueProbe' } satisfies UiNode;
    const dataBindings = {
      summary: {
        componentId: 'summary',
        props: {
          value: { value: { capability: 'state.day', path: 'summary' } },
        },
      },
    } satisfies ComponentDataBindingRegistry;
    let renderer: ReturnType<typeof create> | undefined;

    act(() => {
      renderer = create(
        <RuntimeRenderer
          dataBindings={dataBindings}
          node={node}
          registry={registry}
          stateAdapter={stateAdapter}
        />,
      );
    });
    if (renderer === undefined) throw new Error('Expected mounted RuntimeRenderer.');

    expect(renderer.root.findByType('output').children).toEqual(['One meal']);

    act(() => {
      expect(stateAdapter.set('day.summary', 'Two meals')).toEqual({ ok: true });
    });
    expect(renderer.root.findByType('output').children).toEqual(['Two meals']);

    act(() => {
      expect(stateAdapter.set('day', { summary: 'Three meals' })).toEqual({ ok: true });
    });
    expect(renderer.root.findByType('output').children).toEqual(['Three meals']);
  });
});

describe('Runtime state repeat reactivity', () => {
  it('rerenders a mounted repeat when its state source changes', () => {
    const stateAdapter = createRuntimeMemoryStateAdapter({
      initialState: { day: { meals: ['Breakfast'] } },
    });
    const node = {
      children: [{ id: 'meal', type: 'ItemProbe' }],
      id: 'meals',
      repeat: {
        itemAlias: 'meal',
        source: { capability: 'state.day', path: 'meals' },
      },
      type: 'ListProbe',
    } satisfies UiNode;
    let renderer: ReturnType<typeof create> | undefined;

    act(() => {
      renderer = create(
        <RuntimeRenderer node={node} registry={registry} stateAdapter={stateAdapter} />,
      );
    });
    if (renderer === undefined) throw new Error('Expected mounted RuntimeRenderer.');

    expect(renderer.root.findAllByProps({ 'data-kind': 'item' })).toHaveLength(1);

    act(() => {
      expect(stateAdapter.set('day.meals', ['Breakfast', 'Lunch'])).toEqual({ ok: true });
    });

    expect(renderer.root.findAllByProps({ 'data-kind': 'item' })).toHaveLength(2);
  });
});

describe('Runtime async repeat reactivity', () => {
  it('keeps root async repeats stable until their context changes', async () => {
    const pending: ((result: RuntimeCapabilityExecutionResult) => void)[] = [];
    const executeCapability = mock(
      (_args: RuntimeCapabilityExecutionArgs) =>
        new Promise<RuntimeCapabilityExecutionResult>((resolve) => {
          pending.push(resolve);
        }),
    );
    const initialContext = { selection: 'today' };
    const updatedContext = { selection: 'tomorrow' };
    const renderer = mountAsyncRepeat(initialContext, executeCapability);

    expect(executeCapability).toHaveBeenCalledTimes(1);
    expect(renderer.root.findAllByProps({ 'data-kind': 'item' })).toHaveLength(0);

    await act(async () => {
      pending[0]?.({ data: ['Breakfast', 'Lunch'], ok: true });
      await Promise.resolve();
    });

    expect(renderer.root.findAllByProps({ 'data-kind': 'item' })).toHaveLength(2);
    expect(executeCapability).toHaveBeenCalledTimes(1);

    act(() => {
      renderer.update(
        <RuntimeRenderer
          bindingContext={updatedContext}
          executeCapability={executeCapability}
          isRoot
          node={asyncRepeatNode}
          registry={registry}
        />,
      );
    });
    expect(executeCapability).toHaveBeenCalledTimes(2);

    await act(async () => {
      pending[1]?.({ data: ['Dinner'], ok: true });
      await Promise.resolve();
    });

    expect(renderer.root.findAllByProps({ 'data-kind': 'item' })).toHaveLength(1);
    expect(executeCapability).toHaveBeenCalledTimes(2);

    act(() => {
      renderer.unmount();
    });
  });
});
