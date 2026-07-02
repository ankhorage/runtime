import type { ComponentDataBindingRegistry, UiNode } from '@ankhorage/contracts';
import { describe, expect, it, mock } from 'bun:test';

import { dispatchRuntimeComponentEventWithReporting } from './runtimeEventExecution';

describe('runtime event execution', () => {
  it('reports missing action diagnostics through the runtime event execution path', async () => {
    const node: UiNode = {
      id: 'save-button',
      type: 'Button',
    };
    const dataBindings: ComponentDataBindingRegistry = {
      'save-button': {
        componentId: 'save-button',
        events: {
          press: [{ target: { kind: 'action', type: 'missing.action' } }],
        },
      },
    };
    const seenDiagnostics: unknown[] = [];

    const diagnostics = await dispatchRuntimeComponentEventWithReporting({
      node,
      eventName: 'press',
      event: {
        type: 'button.press',
        sourceNodeId: 'save-button',
        payload: {},
      },
      dataBindings,
      onDiagnostics: (reportedDiagnostics) => {
        seenDiagnostics.push(reportedDiagnostics);
      },
    });

    expect(diagnostics).toEqual([
      {
        code: 'missing-action-handler',
        message:
          "Action 'missing.action' could not be executed because no runtime executor or handler is registered.",
        severity: 'error',
      },
    ]);
    expect(seenDiagnostics).toEqual([diagnostics]);
  });

  it('falls back to console reporting when no diagnostics handler is configured', async () => {
    const consoleImpl = {
      error: mock(() => undefined),
      warn: mock(() => undefined),
    };

    const diagnostics = await dispatchRuntimeComponentEventWithReporting({
      node: {
        id: 'save-button',
        type: 'Button',
      },
      eventName: 'press',
      event: {
        type: 'button.press',
        sourceNodeId: 'save-button',
        payload: {},
      },
      dataBindings: {
        'save-button': {
          componentId: 'save-button',
          events: {
            press: [{ target: { kind: 'action', type: 'missing.action' } }],
          },
        },
      },
      consoleImpl,
    });

    expect(diagnostics).toHaveLength(1);
    expect(consoleImpl.error).toHaveBeenCalledWith(
      '[runtime] Event binding diagnostics',
      diagnostics,
    );
    expect(consoleImpl.warn).not.toHaveBeenCalled();
  });

  it('reports empty diagnostics to configured handlers without logging them', async () => {
    const consoleImpl = {
      error: mock(() => undefined),
      warn: mock(() => undefined),
    };
    const seenDiagnostics: unknown[] = [];

    const diagnostics = await dispatchRuntimeComponentEventWithReporting({
      node: {
        id: 'save-button',
        type: 'Button',
      },
      eventName: 'press',
      event: {
        type: 'button.press',
        sourceNodeId: 'save-button',
        payload: {},
      },
      dataBindings: {
        'save-button': {
          componentId: 'save-button',
          events: {},
        },
      },
      onDiagnostics: (reportedDiagnostics) => {
        seenDiagnostics.push(reportedDiagnostics);
      },
      consoleImpl,
    });

    expect(diagnostics).toEqual([]);
    expect(seenDiagnostics).toEqual([[]]);
    expect(consoleImpl.error).not.toHaveBeenCalled();
    expect(consoleImpl.warn).not.toHaveBeenCalled();
  });
});
