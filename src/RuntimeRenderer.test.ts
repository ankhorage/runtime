import type { DataSourceDiagnostic } from '@ankhorage/contracts';
import { describe, expect, it } from 'bun:test';

import { shouldRenderRuntimeRepeatEmptyState } from './runtimeRepeatEmptyState';

const invalidRepeatDiagnostic: DataSourceDiagnostic = {
  code: 'invalid-config',
  message: 'Repeat source must resolve to an array.',
  severity: 'error',
};

describe('shouldRenderRuntimeRepeatEmptyState', () => {
  it('returns true for a successfully resolved empty repeat without errors', () => {
    expect(
      shouldRenderRuntimeRepeatEmptyState({
        diagnostics: [],
        items: [],
        status: 'ready',
      }),
    ).toBe(true);
  });

  it('returns false while repeat resolution is still pending', () => {
    expect(
      shouldRenderRuntimeRepeatEmptyState({
        diagnostics: [],
        items: [],
        status: 'pending',
      }),
    ).toBe(false);
  });

  it('returns false when repeat resolution produced one or more items', () => {
    expect(
      shouldRenderRuntimeRepeatEmptyState({
        diagnostics: [],
        items: [{ id: 'product-1' }],
        status: 'ready',
      }),
    ).toBe(false);
  });

  it('returns false when repeat resolution has an error diagnostic', () => {
    expect(
      shouldRenderRuntimeRepeatEmptyState({
        diagnostics: [invalidRepeatDiagnostic],
        items: [],
        status: 'ready',
      }),
    ).toBe(false);
  });
});
