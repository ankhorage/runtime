import { describe, expect, it } from 'bun:test';

import {
  isRuntimeContextCapabilityOutputPath,
  resolveRuntimeContextCapability,
} from './resolveRuntimeContextCapability';

describe('runtime.eventOperation capability', () => {
  it('exposes the event-operation lifecycle and validates its declared output paths', () => {
    const result = resolveRuntimeContextCapability({ id: 'runtime.eventOperation' });

    expect(result).toMatchObject({
      ok: true,
      capability: {
        id: 'runtime.eventOperation',
        access: ['read', 'subscribe'],
        binding: { kind: 'context', bindableAs: ['source'] },
      },
    });
    if (!result.ok) throw new Error('Expected the event-operation capability.');

    expect(
      isRuntimeContextCapabilityOutputPath({ capability: result.capability, path: 'loading' }),
    ).toBe(true);
    expect(
      isRuntimeContextCapabilityOutputPath({
        capability: result.capability,
        path: 'operation.apiId',
      }),
    ).toBe(true);
    expect(
      isRuntimeContextCapabilityOutputPath({ capability: result.capability, path: 'runtime' }),
    ).toBe(false);
  });
});

describe('runtime.repeat.item capability', () => {
  it('materializes the nearest repeat item schema without alias-dependent identity', () => {
    const outer = resolveRuntimeContextCapability({
      id: 'runtime.repeat.item',
      repeatSourceSchema: {
        type: 'array',
        items: { type: 'object', properties: { id: { type: 'string' } } },
      },
    });
    const inner = resolveRuntimeContextCapability({
      id: 'runtime.repeat.item',
      repeatSourceSchema: {
        type: 'array',
        items: { type: 'object', properties: { sku: { type: 'string' } } },
      },
    });

    expect(outer).toMatchObject({ ok: true, capability: { id: 'runtime.repeat.item' } });
    expect(inner).toMatchObject({ ok: true, capability: { id: 'runtime.repeat.item' } });
    if (!outer.ok || !inner.ok) throw new Error('Expected scoped repeat-item capabilities.');

    expect(isRuntimeContextCapabilityOutputPath({ capability: outer.capability, path: 'id' })).toBe(
      true,
    );
    expect(
      isRuntimeContextCapabilityOutputPath({ capability: outer.capability, path: 'sku' }),
    ).toBe(false);
    expect(
      isRuntimeContextCapabilityOutputPath({ capability: inner.capability, path: 'sku' }),
    ).toBe(true);
  });

  it('rejects unscoped repeat context', () => {
    expect(resolveRuntimeContextCapability({ id: 'runtime.repeat.item' })).toEqual({
      ok: false,
      reason: 'invalid-repeat-item-schema',
    });
  });
});

describe('Runtime context capability ownership', () => {
  it('rejects host context instead of creating a catch-all capability', () => {
    expect(resolveRuntimeContextCapability({ id: 'route.params' })).toEqual({
      ok: false,
      reason: 'unavailable-capability',
    });
  });
});
