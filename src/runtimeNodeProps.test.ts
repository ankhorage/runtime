import type { Action } from '@ankhorage/contracts';
import { describe, expect, it } from 'bun:test';

import { resolveRuntimeNodeProps, wrapRuntimeActionProps } from './runtimeNodeProps';

function isCallable(value: unknown): value is (...args: unknown[]) => void {
  return typeof value === 'function';
}

describe('runtimeNodeProps', () => {
  it('applies resolveNodeProps before action wrapping and preserves source node props', () => {
    const originalAction: Action = {
      type: 'alert',
      payload: { message: 'original' },
    };
    const resolvedAction: Action = {
      type: 'setLanguage',
      payload: { locale: 'de' },
    };
    const node = {
      id: 'node-1',
      type: 'Button',
      props: {
        onPress: originalAction,
        text: 'Original',
      },
      style: {
        padding: 12,
      },
    };

    const resolvedProps = resolveRuntimeNodeProps({
      node,
      resolveNodeProps: ({ props }) => ({
        ...props,
        onPress: resolvedAction,
        text: 'Resolved',
      }),
    });

    const triggeredActions: unknown[] = [];
    const wrappedProps = wrapRuntimeActionProps({
      props: resolvedProps,
      disableActions: false,
      handleAction: (action) => {
        triggeredActions.push(action);
      },
      actionHandlerCache: new WeakMap(),
      functionHandlerCache: new WeakMap(),
    });

    expect(node.props).toEqual({
      onPress: originalAction,
      text: 'Original',
    });
    expect(resolvedProps).toEqual({
      testID: 'node-1',
      onPress: resolvedAction,
      text: 'Resolved',
      style: {
        padding: 12,
      },
    });

    const { onPress } = wrappedProps;
    expect(isCallable(onPress)).toBe(true);
    if (!isCallable(onPress)) {
      throw new Error('expected wrapped onPress handler');
    }

    onPress();

    expect(triggeredActions).toEqual([resolvedAction]);
  });

  it('disables action props without mutating the resolved props input', () => {
    const action: Action = {
      type: 'console',
      payload: { message: 'hidden' },
    };
    const resolvedProps = {
      onPress: action,
      text: 'Static',
    };

    const wrappedProps = wrapRuntimeActionProps({
      props: resolvedProps,
      disableActions: true,
      handleAction: () => undefined,
      actionHandlerCache: new WeakMap(),
      functionHandlerCache: new WeakMap(),
    });

    expect(resolvedProps.onPress).toBe(action);
    expect(wrappedProps).toEqual({
      onPress: expect.any(Function),
      text: 'Static',
    });

    const { onPress } = wrappedProps;
    expect(isCallable(onPress)).toBe(true);
    if (!isCallable(onPress)) {
      throw new Error('expected disabled onPress to remain callable');
    }

    onPress();
  });

  it('converts non-empty string action ids into callable handlers', () => {
    const triggeredActions: unknown[] = [];
    const wrappedProps = wrapRuntimeActionProps({
      props: {
        onManualEntry: 'action.manualEntryRequested',
      },
      disableActions: false,
      handleAction: (action) => {
        triggeredActions.push(action);
      },
      actionHandlerCache: new WeakMap(),
      functionHandlerCache: new WeakMap(),
    });

    const { onManualEntry } = wrappedProps;
    expect(isCallable(onManualEntry)).toBe(true);
    if (!isCallable(onManualEntry)) {
      throw new Error('expected wrapped onManualEntry handler');
    }

    onManualEntry();

    expect(triggeredActions).toEqual([{ type: 'action.manualEntryRequested' }]);
  });

  it('passes plain-object callback payloads through string action shorthand handlers', () => {
    const triggeredActions: unknown[] = [];
    const wrappedProps = wrapRuntimeActionProps({
      props: {
        onBarcodeScanned: 'action.barcodeCaptured',
      },
      disableActions: false,
      handleAction: (action) => {
        triggeredActions.push(action);
      },
      actionHandlerCache: new WeakMap(),
      functionHandlerCache: new WeakMap(),
    });

    const { onBarcodeScanned } = wrappedProps;
    expect(isCallable(onBarcodeScanned)).toBe(true);
    if (!isCallable(onBarcodeScanned)) {
      throw new Error('expected wrapped onBarcodeScanned handler');
    }

    const scanPayload = { data: '0123456789', format: 'ean13' };
    onBarcodeScanned(scanPayload);

    expect(triggeredActions).toEqual([
      {
        type: 'action.barcodeCaptured',
        payload: scanPayload,
      },
    ]);
  });

  it('wraps non-object callback args in an args payload for string action shorthand handlers', () => {
    const triggeredActions: unknown[] = [];
    const wrappedProps = wrapRuntimeActionProps({
      props: {
        onValueChange: 'settings.changeValue',
      },
      disableActions: false,
      handleAction: (action) => {
        triggeredActions.push(action);
      },
      actionHandlerCache: new WeakMap(),
      functionHandlerCache: new WeakMap(),
    });

    const { onValueChange } = wrappedProps;
    expect(isCallable(onValueChange)).toBe(true);
    if (!isCallable(onValueChange)) {
      throw new Error('expected wrapped onValueChange handler');
    }

    onValueChange('abc', 7);

    expect(triggeredActions).toEqual([
      {
        type: 'settings.changeValue',
        payload: {
          args: ['abc', 7],
        },
      },
    ]);
  });

  it('does not turn blank string action ids into handlers', () => {
    const wrappedProps = wrapRuntimeActionProps({
      props: {
        onPress: '   ',
        text: 'Static',
      },
      disableActions: false,
      handleAction: () => undefined,
      actionHandlerCache: new WeakMap(),
      functionHandlerCache: new WeakMap(),
    });

    expect(wrappedProps).toEqual({
      onPress: '   ',
      text: 'Static',
    });
  });

  it('keeps disabled string action props visually present with inert no-op callbacks', () => {
    const triggeredActions: unknown[] = [];
    const wrappedProps = wrapRuntimeActionProps({
      props: {
        onManualEntry: 'action.manualEntryRequested',
        text: 'Static',
      },
      disableActions: true,
      handleAction: (action) => {
        triggeredActions.push(action);
      },
      actionHandlerCache: new WeakMap(),
      functionHandlerCache: new WeakMap(),
    });

    const { onManualEntry } = wrappedProps;
    expect(isCallable(onManualEntry)).toBe(true);
    if (!isCallable(onManualEntry)) {
      throw new Error('expected disabled string action to remain callable');
    }

    onManualEntry({ data: '0123456789' });

    expect(triggeredActions).toEqual([]);
  });

  it('keeps disabled action objects visually present with inert no-op callbacks', () => {
    const triggeredActions: unknown[] = [];
    const wrappedProps = wrapRuntimeActionProps({
      props: {
        onPress: {
          type: 'action.manualEntryRequested',
        },
        text: 'Static',
      },
      disableActions: true,
      handleAction: (action) => {
        triggeredActions.push(action);
      },
      actionHandlerCache: new WeakMap(),
      functionHandlerCache: new WeakMap(),
    });

    const { onPress } = wrappedProps;
    expect(isCallable(onPress)).toBe(true);
    if (!isCallable(onPress)) {
      throw new Error('expected disabled action object to remain callable');
    }

    onPress();

    expect(triggeredActions).toEqual([]);
  });

  it('coerces image asset sources to renderable URLs', () => {
    const storageNode = {
      id: 'img-1',
      type: 'Image',
      props: {
        source: {
          kind: 'storage',
          bucket: 'assets',
          path: 'public/avatar.png',
          publicUrl:
            'https://example.supabase.co/storage/v1/object/public/assets/public/avatar.png',
        },
      },
    };

    const urlNode = {
      id: 'img-2',
      type: 'Image',
      props: {
        source: {
          kind: 'url',
          url: 'https://example.com/image.png',
        },
      },
    };

    const resolvedStorage = resolveRuntimeNodeProps({ node: storageNode });
    expect(resolvedStorage.source).toBe(
      'https://example.supabase.co/storage/v1/object/public/assets/public/avatar.png',
    );

    const resolvedUrl = resolveRuntimeNodeProps({ node: urlNode });
    expect(resolvedUrl.source).toBe('https://example.com/image.png');
  });

  it('accepts string URL sources and drops invalid sources for images', () => {
    const stringNode = {
      id: 'img-3',
      type: 'Image',
      props: {
        source: ' https://example.com/string.png ',
      },
    };

    const invalidNode = {
      id: 'img-4',
      type: 'Image',
      props: {
        source: { kind: 'storage', bucket: 'assets', path: 'x' },
      },
    };

    const emptyNode = {
      id: 'img-5',
      type: 'Image',
      props: {
        source: '   ',
      },
    };

    const resolvedString = resolveRuntimeNodeProps({ node: stringNode });
    expect(resolvedString.source).toBe('https://example.com/string.png');

    const resolvedInvalid = resolveRuntimeNodeProps({ node: invalidNode });
    expect('source' in resolvedInvalid).toBe(false);

    const resolvedEmpty = resolveRuntimeNodeProps({ node: emptyNode });
    expect('source' in resolvedEmpty).toBe(false);
  });
});
