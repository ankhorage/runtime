import { expect, it } from 'bun:test';

import { createRuntimeScreenOperationLoaderRequestLifecycle } from './runtimeScreenLoaders';

it('executes loaders once per dependency key and rejects stale completions', () => {
  const lifecycle = createRuntimeScreenOperationLoaderRequestLifecycle();
  const initialRequestId = lifecycle.start('initial');

  expect(initialRequestId).toBe(1);
  expect(lifecycle.start('initial')).toBeUndefined();
  expect(lifecycle.isCurrent({ dependencyKey: 'initial', requestId: initialRequestId ?? 0 })).toBe(
    true,
  );

  const changedRequestId = lifecycle.start('changed');
  expect(changedRequestId).toBe(2);
  expect(lifecycle.start('changed')).toBeUndefined();
  expect(lifecycle.isCurrent({ dependencyKey: 'initial', requestId: initialRequestId ?? 0 })).toBe(
    false,
  );
  expect(lifecycle.isCurrent({ dependencyKey: 'changed', requestId: changedRequestId ?? 0 })).toBe(
    true,
  );

  lifecycle.invalidate();
  expect(lifecycle.isCurrent({ dependencyKey: 'changed', requestId: changedRequestId ?? 0 })).toBe(
    false,
  );
});
