import type {
  BindingCondition,
  BindingInputMap,
  BindingValue,
  ComponentDataBindingRegistry,
  ComponentEventDto,
  DataEndpointConfig,
  DataSourceConfig,
  DataSourceDiagnostic,
  DataSourceRegistry,
  EventBinding,
  EventBindingTarget,
  UiNode,
} from '@ankhorage/contracts';

import {
  createRuntimeBindingOperationKey,
  resolveBindingInputMap,
  type RuntimeBindingOperationExecutor,
  type RuntimeBindingOperationResultCache,
  type RuntimeBindingOperationResultWriter,
} from './runtimeBindings';
import type { RuntimeActionHandler, RuntimeActionHandlers } from './RuntimeRendererConfig';

type RuntimeEventPayload = Record<string, unknown>;

type RuntimeEventHandler = (...args: unknown[]) => unknown;

type RuntimeOperationEventTarget = Extract<EventBindingTarget, { readonly kind: 'operation' }>;

export interface RuntimeActionRegistry {
  dispatchComponentEvent(args: RuntimeComponentEventDispatchArgs): Promise<void>;
  registerActionHandler(type: string, handler: RuntimeActionHandler): () => void;
}

export interface RuntimeActionResolutionScope {
  readonly context?: Record<string, unknown>;
  readonly operationResults?: RuntimeBindingOperationResultCache;
  readonly state?: Record<string, unknown>;
}

export interface RuntimeActionResolutionArgs extends RuntimeActionResolutionScope {
  readonly event: ComponentEventDto<string, object>;
}

export interface RuntimeComponentEventDispatchArgs extends RuntimeActionResolutionScope {
  readonly node: UiNode;
  readonly event: ComponentEventDto<string, object>;
  readonly eventName?: string;
  readonly executeAction?: RuntimeActionHandler;
  readonly dataSources?: DataSourceRegistry;
  readonly dataBindings?: ComponentDataBindingRegistry;
  readonly executeOperation?: RuntimeBindingOperationExecutor;
  readonly writeOperationResult?: RuntimeBindingOperationResultWriter;
}

export interface RuntimeEventPropWrapArgs extends RuntimeActionResolutionScope {
  readonly node: UiNode;
  readonly props: Record<string, unknown>;
  readonly disableActions: boolean;
  readonly dataBindings?: ComponentDataBindingRegistry;
  readonly dispatchComponentEvent: (
    args: RuntimeComponentEventDispatchArgs,
  ) => Promise<void> | void;
}

export function createRuntimeActionRegistry(
  options: {
    actionHandlers?: RuntimeActionHandlers;
    dataSources?: DataSourceRegistry;
    dataBindings?: ComponentDataBindingRegistry;
    executeAction?: RuntimeActionHandler;
    executeOperation?: RuntimeBindingOperationExecutor;
    operationResults?: RuntimeBindingOperationResultCache;
    writeOperationResult?: RuntimeBindingOperationResultWriter;
  } = {},
): RuntimeActionRegistry {
  const actionHandlers: RuntimeActionHandlers = { ...(options.actionHandlers ?? {}) };

  return {
    async dispatchComponentEvent(args) {
      await dispatchRuntimeComponentEvent({
        ...args,
        actionHandlers,
        dataBindings: args.dataBindings ?? options.dataBindings,
        dataSources: args.dataSources ?? options.dataSources,
        executeAction: args.executeAction ?? options.executeAction,
        executeOperation: args.executeOperation ?? options.executeOperation,
        operationResults: args.operationResults ?? options.operationResults,
        writeOperationResult: args.writeOperationResult ?? options.writeOperationResult,
      });
    },
    registerActionHandler(type, handler) {
      actionHandlers[type] = handler;

      return () => {
        delete actionHandlers[type];
      };
    },
  };
}

export async function dispatchRuntimeComponentEvent(
  args: RuntimeComponentEventDispatchArgs & {
    readonly actionHandlers?: RuntimeActionHandlers;
  },
): Promise<readonly DataSourceDiagnostic[]> {
  const { node, event, eventName = inferLocalEventName(event.type), actionHandlers } = args;
  const eventBindings: readonly EventBinding[] =
    args.dataBindings?.[node.id]?.events?.[eventName] ??
    args.dataBindings?.[node.id]?.events?.[event.type] ??
    [];
  const diagnostics: DataSourceDiagnostic[] = [];
  const dispatchOperationResults: Record<string, BindingValue | undefined> = {
    ...(args.operationResults ?? {}),
  };
  const resolutionArgs: RuntimeComponentEventDispatchArgs = {
    ...args,
    operationResults: dispatchOperationResults,
  };

  for (const binding of eventBindings) {
    if (!matchesBindingCondition(binding.when, resolutionArgs)) continue;

    if (binding.target.kind === 'action') {
      const resolvedPayload = await resolveObjectEventBindingInput(
        binding.input,
        resolutionArgs,
        diagnostics,
      );
      const action =
        resolvedPayload === undefined
          ? { type: binding.target.type }
          : { type: binding.target.type, payload: resolvedPayload };
      if (resolutionArgs.executeAction) {
        await resolutionArgs.executeAction({
          action,
          event,
          node,
          resolvedPayload,
        });
        continue;
      }

      const handler = actionHandlers?.[binding.target.type];
      if (handler) {
        await handler({
          action,
          event,
          node,
          resolvedPayload,
        });
        continue;
      }

      diagnostics.push({
        code: 'missing-action-handler',
        message: `Action '${binding.target.type}' could not be executed because no runtime executor or handler is registered.`,
        severity: 'error',
      });
      continue;
    }

    const operationSucceeded = await dispatchRuntimeOperationEventBinding({
      args: resolutionArgs,
      binding,
      diagnostics,
      operationResults: dispatchOperationResults,
      target: binding.target,
    });

    if (!operationSucceeded) {
      break;
    }
  }

  return diagnostics;
}

export function wrapRuntimeEventProps(args: RuntimeEventPropWrapArgs): Record<string, unknown> {
  const { node, props, disableActions, dispatchComponentEvent } = args;
  const wrappedProps: Record<string, unknown> = { ...props };
  const nodeEventBindings = args.dataBindings?.[node.id]?.events;

  if (disableActions || !nodeEventBindings) {
    return wrappedProps;
  }

  for (const eventName of Object.keys(nodeEventBindings)) {
    const propName = eventNameToCallbackProp(eventName);
    const existingHandler = wrappedProps[propName];

    wrappedProps[propName] = (...handlerArgs: unknown[]) => {
      let existingResult: unknown;

      if (isRuntimeEventHandler(existingHandler)) {
        existingResult = existingHandler(...handlerArgs);
      }

      void dispatchComponentEvent({
        context: args.context,
        dataBindings: args.dataBindings,
        event: createComponentEventFromHandlerArgs({ eventName, handlerArgs, node }),
        eventName,
        node,
        operationResults: args.operationResults,
        state: args.state,
      });

      return existingResult;
    };
  }

  return wrappedProps;
}

export function createComponentEventFromHandlerArgs(args: {
  readonly node: UiNode;
  readonly eventName: string;
  readonly handlerArgs: readonly unknown[];
}): ComponentEventDto<string, RuntimeEventPayload> {
  const { node, eventName, handlerArgs } = args;

  return {
    payload: createPayloadForEvent(eventName, handlerArgs),
    sourceNodeId: node.id,
    type: localEventNameToEventType(eventName),
  };
}

export function resolveRuntimeActionPayload(
  payload: object | undefined,
  args: RuntimeActionResolutionArgs,
): object | undefined {
  if (payload === undefined) {
    return undefined;
  }

  return resolveRuntimeActionValue(payload, args);
}

export function resolveRuntimeActionValue(
  value: unknown,
  args: RuntimeActionResolutionArgs,
): object | undefined {
  if (!isRecord(value)) return undefined;

  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [key, resolveRuntimeActionValueEntry(entry, args)]),
  );
}

async function dispatchRuntimeOperationEventBinding(args: {
  readonly args: RuntimeComponentEventDispatchArgs;
  readonly binding: EventBinding;
  readonly diagnostics: DataSourceDiagnostic[];
  readonly operationResults: Record<string, BindingValue | undefined>;
  readonly target: RuntimeOperationEventTarget;
}): Promise<boolean> {
  const { binding, diagnostics, target } = args;

  if (args.args.executeOperation === undefined) {
    diagnostics.push({
      code: 'missing-adapter',
      dataSourceId: target.operation.dataSourceId,
      endpointId: target.operation.endpointId,
      operationId: target.operation.operationId,
      message: 'Event operation binding requires an injected operation executor.',
      severity: 'error',
    });
    return false;
  }

  const dataSource = args.args.dataSources?.[target.operation.dataSourceId];
  if (dataSource === undefined) {
    diagnostics.push({
      code: 'missing-data-source',
      dataSourceId: target.operation.dataSourceId,
      endpointId: target.operation.endpointId,
      operationId: target.operation.operationId,
      message: `Data source '${target.operation.dataSourceId}' could not be found.`,
      severity: 'error',
    });
    return false;
  }

  const endpoint = resolveEventOperationEndpoint(target, dataSource);
  const result = await args.args.executeOperation({
    dataSource,
    endpoint,
    input: await resolveEventBindingInput(binding.input, args.args, diagnostics),
    node: args.args.node,
    operation: target.operation,
  });
  diagnostics.push(...(result.diagnostics ?? []));

  if (result.ok) {
    const operationKey = createRuntimeBindingOperationKey(target.operation);
    args.operationResults[operationKey] = result.data;
    args.args.writeOperationResult?.(operationKey, result.data);
    return true;
  }

  return false;
}

function resolveRuntimeActionValueEntry(
  value: unknown,
  args: RuntimeActionResolutionArgs,
): unknown {
  if (Array.isArray(value)) return value.map((item) => resolveRuntimeActionValueEntry(item, args));
  if (!isRecord(value)) return value;
  if (!('valueFrom' in value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        key,
        resolveRuntimeActionValueEntry(entry, args),
      ]),
    );
  }

  return undefined;
}

async function resolveObjectEventBindingInput(
  input: BindingInputMap | undefined,
  args: RuntimeComponentEventDispatchArgs,
  diagnostics: DataSourceDiagnostic[],
): Promise<object | undefined> {
  const value = await resolveEventBindingInput(input, args, diagnostics);
  return isRecord(value) ? value : undefined;
}

async function resolveEventBindingInput(
  input: BindingInputMap | undefined,
  args: RuntimeComponentEventDispatchArgs,
  diagnostics: DataSourceDiagnostic[],
) {
  return resolveBindingInputMap(
    input,
    {
      context: args.context,
      dataBindings: args.dataBindings,
      dataSources: args.dataSources,
      event: args.event,
      executeOperation: args.executeOperation,
      operationResults: args.operationResults,
    },
    diagnostics,
  );
}

function matchesBindingCondition(
  condition: BindingCondition | undefined,
  args: RuntimeActionResolutionArgs,
): boolean {
  if (condition === undefined) return true;

  const value = readBindingConditionSource(condition, args);

  switch (condition.operator) {
    case 'eq':
      return value === condition.value;
    case 'exists':
      return value !== undefined;
    case 'neq':
      return value !== condition.value;
    case 'notExists':
      return value === undefined;
  }
}

function readBindingConditionSource(
  condition: BindingCondition,
  args: RuntimeActionResolutionArgs,
): unknown {
  switch (condition.source.kind) {
    case 'context':
      return readPath(args.context, condition.source.path);
    case 'event':
      return readPath(args.event, condition.source.path);
    case 'literal':
      return condition.source.value;
    case 'operation': {
      const operationResult =
        args.operationResults?.[createRuntimeBindingOperationKey(condition.source.operation)];
      return condition.source.path === undefined
        ? operationResult
        : readPath(operationResult, condition.source.path);
    }
    case 'state':
      return readPath(args.state, condition.source.path);
  }
}

function resolveEventOperationEndpoint(
  target: RuntimeOperationEventTarget,
  dataSource: DataSourceConfig,
): DataEndpointConfig | undefined {
  if (target.operation.endpointId !== undefined) {
    return dataSource.endpoints[target.operation.endpointId];
  }

  return Object.values(dataSource.endpoints).find(
    (endpoint) => endpoint.operations[target.operation.operationId] !== undefined,
  );
}

function createPayloadForEvent(
  eventName: string,
  handlerArgs: readonly unknown[],
): RuntimeEventPayload {
  if (eventName === 'barcodeScanned') {
    return createBarcodeScannedPayload(handlerArgs[0]);
  }

  if (eventName === 'submit') {
    return { values: asRecord(handlerArgs[0]) ?? {} };
  }

  if (eventName === 'itemPress') {
    const item = asRecord(handlerArgs[0]) ?? {};
    const itemId = readItemId(handlerArgs[0]);

    return itemId === undefined ? { item } : { itemId, item };
  }

  if (eventName === 'changeText' || eventName === 'valueChange') {
    return { value: handlerArgs[0] };
  }

  if (eventName === 'checkedChange') {
    return { checked: handlerArgs[0] };
  }

  if (eventName === 'manualEntry') {
    return handlerArgs[0] === undefined ? {} : { value: handlerArgs[0] };
  }

  if (eventName === 'requestPermission') {
    return {};
  }

  return {};
}

function localEventNameToEventType(eventName: string): string {
  if (eventName === 'itemPress') return 'collection.itemPress';
  if (eventName === 'press') return 'button.press';
  if (eventName === 'submit') return 'form.submit';

  return eventName;
}

function inferLocalEventName(eventType: string): string {
  const parts = eventType.split('.');

  return parts.at(-1) ?? eventType;
}

function eventNameToCallbackProp(eventName: string): string {
  return `on${eventName.charAt(0).toUpperCase()}${eventName.slice(1)}`;
}

function isRuntimeEventHandler(value: unknown): value is RuntimeEventHandler {
  return typeof value === 'function';
}

function readPath(source: unknown, path: string): unknown {
  if (path.length === 0) return source;

  return path.split('.').reduce<unknown>((currentValue, part) => {
    if (!isRecord(currentValue)) return undefined;
    return currentValue[part];
  }, source);
}

function createBarcodeScannedPayload(value: unknown): RuntimeEventPayload {
  if (typeof value === 'string') {
    return { value };
  }

  if (!isRecord(value)) {
    return {};
  }

  const payload: RuntimeEventPayload = {};
  if (typeof value.value === 'string') payload.value = value.value;
  if (typeof value.type === 'string') payload.type = value.type;

  return payload;
}

function readItemId(value: unknown): string | number | undefined {
  if (typeof value === 'string' || typeof value === 'number') return value;
  if (!isRecord(value)) return undefined;

  const id = value.id ?? value.itemId;

  return typeof id === 'string' || typeof id === 'number' ? id : undefined;
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return isRecord(value) ? value : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
