import type {
  BindingCondition,
  BindingExpression,
  BindingValue,
  ComponentDataBindingRegistry,
  ComponentEventDto,
  DataSourceDiagnostic,
  UiNode,
} from '@ankhorage/contracts';
import { isRecord } from '@ankhorage/utility/object';

import {
  executeRuntimeBindingInvocation,
  resolveRuntimeBindingExpressionSync,
  type RuntimeBindingResultCache,
  type RuntimeBindingResultWriter,
  type RuntimeCapabilityExecutor,
} from './runtimeBindings';
import {
  resolveRuntimeEventOperationErrorMessage,
  type RuntimeEventOperationLifecycle,
} from './runtimeEventOperationLifecycle';

type RuntimeEventPayload = Record<string, unknown>;
type RuntimeEventHandler = (...args: unknown[]) => unknown;

export interface RuntimeActionRegistry {
  dispatchComponentEvent(args: RuntimeComponentEventDispatchArgs): Promise<void>;
}

export interface RuntimeActionResolutionScope {
  readonly context?: Record<string, unknown>;
  readonly resultSlots?: RuntimeBindingResultCache;
  readonly state?: Record<string, unknown>;
}

export interface RuntimeActionResolutionArgs extends RuntimeActionResolutionScope {
  readonly event: ComponentEventDto<string, object>;
}

export interface RuntimeComponentEventDispatchArgs extends RuntimeActionResolutionScope {
  readonly node: UiNode;
  readonly event: ComponentEventDto<string, object>;
  readonly eventName?: string;
  readonly dataBindings?: ComponentDataBindingRegistry;
  readonly executeCapability?: RuntimeCapabilityExecutor;
  readonly writeResultSlot?: RuntimeBindingResultWriter;
  readonly eventOperationLifecycle?: RuntimeEventOperationLifecycle;
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

/*** Creates a registry that dispatches every authored event through one capability executor. */
export function createRuntimeActionRegistry(
  options: Pick<
    RuntimeComponentEventDispatchArgs,
    | 'dataBindings'
    | 'eventOperationLifecycle'
    | 'executeCapability'
    | 'resultSlots'
    | 'writeResultSlot'
  > = {},
): RuntimeActionRegistry {
  return {
    async dispatchComponentEvent(args) {
      await dispatchRuntimeComponentEvent({ ...options, ...args });
    },
  };
}

/*** Executes every matching event invocation through the canonical capability path. */
export async function dispatchRuntimeComponentEvent(
  args: RuntimeComponentEventDispatchArgs,
): Promise<readonly DataSourceDiagnostic[]> {
  const eventName = args.eventName ?? inferLocalEventName(args.event.type);
  const bindings =
    args.dataBindings?.[args.node.id]?.events?.[eventName] ??
    args.dataBindings?.[args.node.id]?.events?.[args.event.type] ??
    [];
  const diagnostics: DataSourceDiagnostic[] = [];
  const resultSlots: Record<string, BindingValue | undefined> = { ...(args.resultSlots ?? {}) };

  for (const binding of bindings) {
    const context = {
      context: args.context,
      event: args.event,
      executeCapability: args.executeCapability,
      resultSlots,
      writeResultSlot: (slot: string, value: BindingValue) => {
        resultSlots[slot] = value;
        args.writeResultSlot?.(slot, value);
      },
    };
    if (!matchesBindingCondition(binding.when, context)) continue;

    const lifecycle = args.eventOperationLifecycle?.start({
      capability: binding.target.capability,
      nodeId: args.node.id,
    });
    if (args.eventOperationLifecycle !== undefined && lifecycle === undefined) break;

    try {
      const result = await executeRuntimeBindingInvocation(
        binding.target,
        context,
        { event: args.event, node: args.node },
        diagnostics,
      );
      if (lifecycle !== undefined && result?.ok) args.eventOperationLifecycle?.succeed(lifecycle);
      else if (lifecycle !== undefined)
        args.eventOperationLifecycle?.fail(
          lifecycle,
          resolveRuntimeEventOperationErrorMessage(diagnostics),
        );
    } catch {
      diagnostics.push({
        code: 'adapter-error',
        message: `Capability '${binding.target.capability}' could not be completed. Please try again.`,
        severity: 'error',
      });
      if (lifecycle !== undefined)
        args.eventOperationLifecycle?.fail(
          lifecycle,
          resolveRuntimeEventOperationErrorMessage(diagnostics),
        );
      break;
    }
  }

  return diagnostics;
}

/*** Wraps component callbacks so manifest event bindings retain the original callback behavior. */
export function wrapRuntimeEventProps(args: RuntimeEventPropWrapArgs): Record<string, unknown> {
  const props = { ...args.props };
  if (args.disableActions || args.dataBindings?.[args.node.id]?.events === undefined) return props;

  for (const eventName of Object.keys(args.dataBindings[args.node.id]?.events ?? {})) {
    const propName = eventNameToCallbackProp(eventName);
    const existing = props[propName];
    props[propName] = (...handlerArgs: unknown[]) => {
      const result = isRuntimeEventHandler(existing) ? existing(...handlerArgs) : undefined;
      void args.dispatchComponentEvent({
        context: args.context,
        dataBindings: args.dataBindings,
        event: createComponentEventFromHandlerArgs({ eventName, handlerArgs, node: args.node }),
        eventName,
        node: args.node,
        resultSlots: args.resultSlots,
        state: args.state,
      });
      return result;
    };
  }
  return props;
}

/*** Maps a platform callback invocation to the portable component event representation. */
export function createComponentEventFromHandlerArgs(args: {
  readonly node: UiNode;
  readonly eventName: string;
  readonly handlerArgs: readonly unknown[];
}): ComponentEventDto<string, RuntimeEventPayload> {
  return {
    payload: createPayloadForEvent(args.eventName, args.handlerArgs),
    sourceNodeId: args.node.id,
    type: localEventNameToEventType(args.eventName),
  };
}

/*** Resolves an authored expression-shaped payload for imperative consumers. */
export function resolveRuntimeActionValue(
  value: BindingExpression,
  args: RuntimeActionResolutionArgs,
): BindingValue | undefined {
  return resolveRuntimeBindingExpressionSync(value, args);
}

function matchesBindingCondition(
  condition: BindingCondition | undefined,
  context: Parameters<typeof resolveRuntimeBindingExpressionSync>[1],
): boolean {
  if (condition === undefined) return true;
  const source = resolveRuntimeBindingExpressionSync(condition.source, context);
  const value =
    condition.value === undefined
      ? undefined
      : resolveRuntimeBindingExpressionSync(condition.value, context);
  if (condition.operator === 'exists') return source !== undefined;
  if (condition.operator === 'notExists') return source === undefined;
  if (condition.operator === 'eq') return source === value;
  return source !== value;
}

function createPayloadForEvent(eventName: string, args: readonly unknown[]): RuntimeEventPayload {
  if (eventName === 'submit') return { values: asRecord(args[0]) ?? {} };
  if (eventName === 'changeText' || eventName === 'valueChange') return { value: args[0] };
  if (eventName === 'checkedChange') return { checked: args[0] };
  if (eventName === 'itemPress') {
    const item = asRecord(args[0]) ?? {};
    return typeof item.id === 'string' || typeof item.id === 'number'
      ? { item, itemId: item.id }
      : { item };
  }
  return asRecord(args[0]) ?? {};
}

function localEventNameToEventType(eventName: string): string {
  if (eventName === 'itemPress') return 'collection.itemPress';
  if (eventName === 'press') return 'button.press';
  if (eventName === 'submit') return 'form.submit';
  return eventName;
}

function inferLocalEventName(eventType: string): string {
  return eventType.split('.').at(-1) ?? eventType;
}

function eventNameToCallbackProp(eventName: string): string {
  return `on${eventName.charAt(0).toUpperCase()}${eventName.slice(1)}`;
}

function isRuntimeEventHandler(value: unknown): value is RuntimeEventHandler {
  return typeof value === 'function';
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return isRecord(value) ? value : undefined;
}
