import { expect, it } from 'bun:test';

import { createRuntimeMemoryStateAdapter } from './runtimeStateAdapter';

it('applies first and consecutive append updates atomically and notifies related subscribers', () => {
  const stateAdapter = createRuntimeMemoryStateAdapter();
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

it('delivers reentrant updates in subscriber order without regressing later subscribers', () => {
  const stateAdapter = createRuntimeMemoryStateAdapter({ initialState: { meals: [] } });
  const firstSubscriberSnapshots: unknown[] = [];
  const secondSubscriberSnapshots: unknown[] = [];
  const firstSubscription = stateAdapter.subscribe('meals', ({ value }) => {
    firstSubscriberSnapshots.push(value);
    if (Array.isArray(value) && value.length === 1)
      expect(stateAdapter.update?.('meals', { kind: 'append', value: 'Lunch' })).toEqual({
        data: ['Breakfast', 'Lunch'],
        ok: true,
      });
  });
  const secondSubscription = stateAdapter.subscribe('meals', ({ value }) => {
    secondSubscriberSnapshots.push(value);
  });

  expect(stateAdapter.update?.('meals', { kind: 'append', value: 'Breakfast' })).toEqual({
    data: ['Breakfast'],
    ok: true,
  });
  expect(stateAdapter.get('meals')).toEqual({ data: ['Breakfast', 'Lunch'], ok: true });
  expect(firstSubscriberSnapshots).toEqual([['Breakfast'], ['Breakfast', 'Lunch']]);
  expect(secondSubscriberSnapshots).toEqual([['Breakfast'], ['Breakfast', 'Lunch']]);
  if (firstSubscription.ok) void firstSubscription.data.unsubscribe();
  if (secondSubscription.ok) void secondSubscription.data.unsubscribe();
});

it('preserves scalar, object, and array append values as individual elements', () => {
  const stateAdapter = createRuntimeMemoryStateAdapter();
  const values = ['Lunch', { name: 'Dinner' }, ['Snack', 'Dessert']];

  for (const value of values) {
    expect(stateAdapter.update?.('meals', { kind: 'append', value })).toEqual({
      data: values.slice(0, values.indexOf(value) + 1),
      ok: true,
    });
  }
});

it('rejects append updates for incompatible existing state values', () => {
  const stateAdapter = createRuntimeMemoryStateAdapter({ initialState: { meal: 'Breakfast' } });

  expect(stateAdapter.update?.('meal', { kind: 'append', value: 'Lunch' })).toEqual({
    error: {
      code: 'incompatible_value',
      message: 'Append updates require an existing array state value.',
    },
    ok: false,
  });
});
