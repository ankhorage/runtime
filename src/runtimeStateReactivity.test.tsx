import type { ComponentDataBindingRegistry, UiNode } from '@ankhorage/contracts';
import { describe, expect, it, mock } from 'bun:test';
import React from 'react';
import { act, create } from 'react-test-renderer';

import type { ComponentRegistry } from './registry';
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

const registry: ComponentRegistry = {
  ItemProbe,
  ListProbe,
  ValueProbe,
};

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
