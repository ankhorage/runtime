import type { ComponentDataBindingRegistry, UiNode } from '@ankhorage/contracts';
import { describe, expect, it } from 'bun:test';

import {
  createComponentEventFromHandlerArgs,
  createRuntimeActionRegistry,
  dispatchRuntimeComponentEvent,
  wrapRuntimeEventProps,
} from './runtimeActionRegistry';

function isNoArgFunction(value: unknown): value is () => unknown {
  return typeof value === 'function';
}

function createActionBindings(): ComponentDataBindingRegistry {
  return {
    'save-button': {
      componentId: 'save-button',
      events: {
        press: [{ target: { kind: 'action', type: 'console' } }],
      },
    },
  };
}

describe('runtime action registry actions', () => {
  it('dispatches component event bindings to registered action handlers', async () => {
    const handled: object[] = [];
    const diagnostics = await dispatchRuntimeComponentEvent({
      node: { id: 'contact-form', type: 'Form' },
      eventName: 'submit',
      event: {
        type: 'form.submit',
        sourceNodeId: 'contact-form',
        payload: { values: { message: ' Hello ' } },
      },
      dataBindings: {
        'contact-form': {
          componentId: 'contact-form',
          events: {
            submit: [
              {
                target: { kind: 'action', type: 'email.send' },
                input: {
                  message: {
                    kind: 'source',
                    source: { kind: 'event', path: 'payload.values.message' },
                    transforms: ['trim'],
                  },
                },
              },
            ],
          },
        },
      },
      actionHandlers: {
        'email.send': ({ resolvedPayload }) => {
          if (resolvedPayload !== undefined) handled.push(resolvedPayload);
        },
      },
    });

    expect(diagnostics).toEqual([]);
    expect(handled).toEqual([{ message: 'Hello' }]);
  });

  it('reports an action binding without an executor or handler', async () => {
    const diagnostics = await dispatchRuntimeComponentEvent({
      node: { id: 'save-button', type: 'Button' },
      eventName: 'press',
      event: { type: 'button.press', sourceNodeId: 'save-button', payload: {} },
      dataBindings: {
        'save-button': {
          componentId: 'save-button',
          events: {
            press: [{ target: { kind: 'action', type: 'missing.action' } }],
          },
        },
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
  });

  it('creates canonical form and scanner events from handler args', () => {
    const formNode: UiNode = { id: 'contact-form', type: 'Form' };
    const scannerNode: UiNode = { id: 'scanner', type: 'BarcodeScannerView' };

    expect(
      createComponentEventFromHandlerArgs({
        node: formNode,
        eventName: 'submit',
        handlerArgs: [{ message: 'Hello' }],
      }),
    ).toEqual({
      type: 'form.submit',
      sourceNodeId: 'contact-form',
      payload: { values: { message: 'Hello' } },
    });
    expect(
      createComponentEventFromHandlerArgs({
        node: scannerNode,
        eventName: 'barcodeScanned',
        handlerArgs: [{ value: '7612345678901', type: 'ean13' }],
      }),
    ).toEqual({
      type: 'barcodeScanned',
      sourceNodeId: 'scanner',
      payload: { value: '7612345678901', type: 'ean13' },
    });
  });

  it('wraps bound event props while preserving existing handlers', () => {
    const calls: string[] = [];
    const props = wrapRuntimeEventProps({
      node: { id: 'save-button', type: 'Button' },
      dataBindings: createActionBindings(),
      props: {
        onPress: () => {
          calls.push('existing');
        },
      },
      disableActions: false,
      dispatchComponentEvent: ({ event }) => {
        calls.push(event.type);
      },
    });

    if (!isNoArgFunction(props.onPress)) throw new TypeError('Expected onPress handler.');
    props.onPress();
    expect(calls).toEqual(['existing', 'button.press']);
  });

  it('supports imperative action handler registration and unregistration', async () => {
    const handled: string[] = [];
    const registry = createRuntimeActionRegistry({ dataBindings: createActionBindings() });
    const unregister = registry.registerActionHandler('console', ({ action }) => {
      handled.push(action.type);
    });
    const event = { type: 'button.press', sourceNodeId: 'save-button', payload: {} };
    const node: UiNode = { id: 'save-button', type: 'Button' };

    await registry.dispatchComponentEvent({ node, eventName: 'press', event });
    unregister();
    await registry.dispatchComponentEvent({ node, eventName: 'press', event });

    expect(handled).toEqual(['console']);
  });
});
