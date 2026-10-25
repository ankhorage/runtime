import { expect, it } from 'bun:test';

import { createRuntimeMemoryStateAdapter } from './runtimeStateAdapter';

it('applies consecutive append updates atomically and notifies related subscribers', () => {
  const stateAdapter = createRuntimeMemoryStateAdapter({ initialState: { day: { meals: [] } } });
  const snapshots: unknown[] = [];
  const subscription = stateAdapter.subscribe('day', ({ value }) => snapshots.push(value));

  expect(stateAdapter.update?.('day.meals', { kind: 'append', value: 'Breakfast' })).toEqual({
    data: ['Breakfast'],
    ok: true,
  });
  expect(stateAdapter.update?.('day.meals', { kind: 'append', value: 'Lunch' })).toEqual({
    data: ['Breakfast', 'Lunch'],
    ok: true,
  });
  expect(stateAdapter.get('day.meals')).toEqual({ data: ['Breakfast', 'Lunch'], ok: true });
  expect(snapshots).toEqual([{ meals: ['Breakfast'] }, { meals: ['Breakfast', 'Lunch'] }]);
  if (subscription.ok) void subscription.data.unsubscribe();
});

it('commits an update before synchronous reentrant subscribers observe it', () => {
  const stateAdapter = createRuntimeMemoryStateAdapter({ initialState: { meals: [] } });
  const subscription = stateAdapter.subscribe('meals', ({ value }) => {
    if (Array.isArray(value) && value.length === 1)
      expect(stateAdapter.update?.('meals', { kind: 'append', value: 'Lunch' })).toEqual({
        data: ['Breakfast', 'Lunch'],
        ok: true,
      });
  });

  expect(stateAdapter.update?.('meals', { kind: 'append', value: 'Breakfast' })).toEqual({
    data: ['Breakfast'],
    ok: true,
  });
  expect(stateAdapter.get('meals')).toEqual({ data: ['Breakfast', 'Lunch'], ok: true });
  if (subscription.ok) void subscription.data.unsubscribe();
});

it('rejects append updates for missing or incompatible state values', () => {
  const stateAdapter = createRuntimeMemoryStateAdapter({ initialState: { meal: 'Breakfast' } });

  expect(stateAdapter.update?.('missing', { kind: 'append', value: 'Lunch' })).toEqual({
    error: {
      code: 'incompatible_value',
      message: 'Append updates require an existing array state value.',
    },
    ok: false,
  });
  expect(stateAdapter.update?.('meal', { kind: 'append', value: 'Lunch' })).toEqual({
    error: {
      code: 'incompatible_value',
      message: 'Append updates require an existing array state value.',
    },
    ok: false,
  });
});
