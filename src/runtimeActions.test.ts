import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { Action } from '@ankhorage/contracts';
import { describe, expect, it } from 'bun:test';

import { executeRuntimeAction } from './runtimeActions';
import { createRepeatDiagnosticsKey } from './runtimeRepeatDiagnostics';

const runtimeRendererSource = readFileSync(join(import.meta.dir, 'RuntimeRenderer.tsx'), 'utf8');

function readStringProperty(value: unknown, key: string): string | undefined {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return undefined;
  }

  const record = value as Record<string, unknown>;
  const property = record[key];

  return typeof property === 'string' ? property : undefined;
}

describe('executeRuntimeAction', () => {
  it('navigates using manifest route paths and resolves dynamic placeholders', async () => {
    const pushes: { pathname: string; params: Record<string, string | number> }[] = [];

    await executeRuntimeAction({
      action: {
        type: 'navigate',
        payload: {
          route: '/products/[id]',
          params: {
            id: '23432',
            barcode: '7612345678901',
          },
        },
      },
      router: {
        push: (args) => {
          pushes.push(args);
        },
      },
      mode: 'light',
      setMode: () => undefined,
      requestAnimationFrameImpl: (callback) => {
        callback(0);
        return 0;
      },
      alertImpl: () => undefined,
      consoleImpl: { log: () => undefined },
    });

    expect(pushes).toEqual([
      {
        pathname: '/products/23432',
        params: { barcode: '7612345678901' },
      },
    ]);
  });

  it('normalizes bare route targets without introducing a screen-id action', async () => {
    const pushes: { pathname: string; params: Record<string, string | number> }[] = [];

    await executeRuntimeAction({
      action: {
        type: 'navigate',
        payload: {
          route: 'products/create',
          params: { barcode: '7612345678901' },
        },
      },
      router: {
        push: (args) => {
          pushes.push(args);
        },
      },
      mode: 'light',
      setMode: () => undefined,
      actionHandlers: {
        navigate: () => {
          throw new Error('navigate should remain a built-in runtime action');
        },
      },
      requestAnimationFrameImpl: (callback) => {
        callback(0);
        return 0;
      },
      alertImpl: () => undefined,
      consoleImpl: { log: () => undefined },
    });

    expect(pushes).toEqual([
      {
        pathname: '/products/create',
        params: { barcode: '7612345678901' },
      },
    ]);
  });

  it('delegates setLanguage to configured action handlers', async () => {
    const action: Action = {
      type: 'setLanguage',
      payload: { locale: 'de' },
    };
    const handledLocales: string[] = [];

    await executeRuntimeAction({
      action,
      router: {
        push: () => undefined,
      },
      mode: 'light',
      setMode: () => undefined,
      actionHandlers: {
        setLanguage: ({ action: handledAction }) => {
          if (handledAction.type !== 'setLanguage') {
            throw new Error('expected setLanguage action');
          }

          const locale = readStringProperty(handledAction.payload, 'locale');
          if (locale !== undefined) {
            handledLocales.push(locale);
          }
        },
      },
      requestAnimationFrameImpl: () => 0,
      alertImpl: () => undefined,
      consoleImpl: { log: () => undefined },
    });

    expect(handledLocales).toEqual(['de']);
  });

  it('keeps built-in actions owned by runtime even when action handlers are configured', async () => {
    const handledActionTypes: string[] = [];
    const modes: string[] = [];

    await executeRuntimeAction({
      action: { type: 'toggleDarkMode' },
      router: {
        push: () => undefined,
      },
      mode: 'light',
      setMode: (mode) => {
        modes.push(mode);
      },
      actionHandlers: {
        toggleDarkMode: ({ action }) => {
          handledActionTypes.push(action.type);
        },
      },
      requestAnimationFrameImpl: () => 0,
      alertImpl: () => undefined,
      consoleImpl: { log: () => undefined },
    });

    expect(modes).toEqual(['dark']);
    expect(handledActionTypes).toEqual([]);
  });
});

describe('RuntimeRenderer action handler wiring', () => {
  it('routes action execution through injected executeAction before falling back to handlers', () => {
    expect(runtimeRendererSource).toContain('if (effectiveConfig.executeAction) {');
    expect(runtimeRendererSource).toContain(
      'executeAction: effectiveConfig.executeAction ?? executeRuntimeAction',
    );
  });

  it('routes runtime component event diagnostics through the generic runtime reporter', () => {
    expect(runtimeRendererSource).toContain('dispatchRuntimeComponentEventWithReporting({');
    expect(runtimeRendererSource).toContain('onDiagnostics: effectiveConfig.onDiagnostics');
  });

  it('does not depend on the old local runtime action hook', () => {
    expect(runtimeRendererSource.includes('useRuntimeAction(')).toBe(false);
  });

  it('wraps manifest node events after prop actions', () => {
    const propActionWrapIndex = runtimeRendererSource.indexOf(
      'const propsWithActions = wrapRuntimeActionProps',
    );
    const eventWrapIndex = runtimeRendererSource.indexOf(
      'const propsWithEvents = wrapRuntimeEventProps',
    );

    expect(propActionWrapIndex).toBeGreaterThanOrEqual(0);
    expect(eventWrapIndex).toBeGreaterThanOrEqual(0);
    expect(propActionWrapIndex).toBeLessThan(eventWrapIndex);
  });

  it('deduplicates repeated repeat diagnostics by node and diagnostic content', () => {
    const diagnostics = [
      {
        code: 'invalid-config',
        message: 'Repeat source must resolve to an array.',
        severity: 'error' as const,
        dataSourceId: 'nutrition-api',
        endpointId: 'products',
        operationId: 'products.list',
      },
    ] as const;
    const changedDiagnostics = [
      {
        code: 'invalid-config',
        message: 'Different diagnostic.',
        severity: 'error',
        dataSourceId: 'nutrition-api',
        endpointId: 'products',
        operationId: 'products.list',
      },
    ] as const;

    expect(createRepeatDiagnosticsKey('products-grid', diagnostics)).toBe(
      createRepeatDiagnosticsKey('products-grid', [...diagnostics]),
    );
    expect(createRepeatDiagnosticsKey('products-grid', diagnostics)).not.toBe(
      createRepeatDiagnosticsKey('other-grid', diagnostics),
    );
    expect(createRepeatDiagnosticsKey('products-grid', diagnostics)).not.toBe(
      createRepeatDiagnosticsKey('products-grid', changedDiagnostics),
    );
  });
});
