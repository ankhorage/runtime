import type {
  ComponentDataBindingRegistry,
  DataSourceRegistry,
  DbAdapter,
  DbRealtimeAdapter,
  StateAdapter,
  UiNode,
} from '@ankhorage/contracts';

import { resolveRuntimeBindings, type RuntimeBindingOperationResultCache } from './runtimeBindings';
import type { RuntimeAction, RuntimeRendererConfig } from './RuntimeRendererConfig';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (!isRecord(value)) {
    return false;
  }

  const prototype = Reflect.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function hasActionShape(value: unknown): value is RuntimeAction {
  return (
    typeof value === 'object' && value !== null && 'type' in value && typeof value.type === 'string'
  );
}

function isCallbackProp(value: unknown): value is (...args: unknown[]) => unknown {
  return typeof value === 'function';
}

function isNonEmptyActionId(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function createStringActionPayload(args: unknown[]): { payload?: object } {
  if (args.length === 0) {
    return {};
  }

  const [firstArg] = args;
  if (isPlainObject(firstArg)) {
    return { payload: firstArg };
  }

  return {
    payload: {
      args,
    },
  };
}

const noopRuntimeActionHandler = () => undefined;

function resolveImageAssetUrl(value: unknown): string | null {
  if (typeof value === 'string') {
    const url = value.trim();
    return url.length ? url : null;
  }

  if (!isRecord(value) || typeof value.kind !== 'string') {
    return null;
  }

  if (value.kind === 'url' && typeof value.url === 'string') {
    const url = value.url.trim();
    return url.length ? url : null;
  }

  if (value.kind === 'storage' && typeof value.publicUrl === 'string') {
    const publicUrl = value.publicUrl.trim();
    return publicUrl.length ? publicUrl : null;
  }

  return null;
}

export function resolveRuntimeNodeProps(args: {
  node: UiNode;
  resolveNodeProps?: RuntimeRendererConfig['resolveNodeProps'];
  stateAdapter?: StateAdapter;
  dbAdapter?: DbAdapter;
  dbRealtimeAdapter?: DbRealtimeAdapter;
  bindingContext?: Record<string, unknown>;
  dataSources?: DataSourceRegistry;
  dataBindings?: ComponentDataBindingRegistry;
  operationResults?: RuntimeBindingOperationResultCache;
}): Record<string, unknown> {
  const { node, resolveNodeProps } = args;

  const baseProps: Record<string, unknown> = {
    testID: node.id,
    ...(node.props ?? {}),
  };

  if (node.type === 'Image') {
    const resolvedSource = resolveImageAssetUrl(baseProps.source);
    if (resolvedSource !== null) baseProps.source = resolvedSource;
    else delete baseProps.source;
  }

  if (node.style) {
    baseProps.style = baseProps.style ? [baseProps.style, node.style] : node.style;
  }

  const bindingResult = resolveRuntimeBindings({
    context: args.bindingContext,
    dataBindings: args.dataBindings,
    dataSources: args.dataSources,
    node,
    operationResults: args.operationResults,
    props: baseProps,
    stateAdapter: args.stateAdapter,
  });

  return resolveNodeProps
    ? resolveNodeProps({ node, props: bindingResult.props })
    : bindingResult.props;
}

export function wrapRuntimeActionProps(args: {
  props: Record<string, unknown>;
  disableActions: boolean;
  handleAction: (action: RuntimeAction) => void;
  actionHandlerCache: WeakMap<object, (...args: unknown[]) => void>;
  functionHandlerCache: WeakMap<(...args: unknown[]) => unknown, (...args: unknown[]) => unknown>;
}): Record<string, unknown> {
  const { props, disableActions, handleAction, actionHandlerCache, functionHandlerCache } = args;
  const wrappedProps: Record<string, unknown> = { ...props };

  Object.keys(wrappedProps).forEach((key) => {
    if (!key.startsWith('on')) {
      return;
    }

    const value = wrappedProps[key];

    if (disableActions) {
      wrappedProps[key] =
        hasActionShape(value) || isNonEmptyActionId(value) ? noopRuntimeActionHandler : undefined;
      return;
    }

    if (hasActionShape(value)) {
      const actionObject = value;
      let actionHandler = actionHandlerCache.get(actionObject);
      if (!actionHandler) {
        actionHandler = () => {
          handleAction(actionObject);
        };
        actionHandlerCache.set(actionObject, actionHandler);
      }
      wrappedProps[key] = actionHandler;
      return;
    }

    if (isNonEmptyActionId(value)) {
      const actionId = value.trim();
      wrappedProps[key] = (...handlerArgs: unknown[]) => {
        handleAction({
          type: actionId,
          ...createStringActionPayload(handlerArgs),
        });
      };
      return;
    }

    if (isCallbackProp(value)) {
      const handler = value;
      let wrappedHandler = functionHandlerCache.get(handler);
      if (!wrappedHandler) {
        wrappedHandler = (...handlerArgs: unknown[]) => handler(...handlerArgs);
        functionHandlerCache.set(handler, wrappedHandler);
      }
      wrappedProps[key] = wrappedHandler;
    }
  });

  return wrappedProps;
}
