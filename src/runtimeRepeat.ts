import type {
  BindingValue,
  DataSourceDiagnostic,
  UiNode,
  UiNodeRepeatSpec,
} from '@ankhorage/contracts';

import {
  resolveRuntimeBindingExpression,
  resolveRuntimeBindingExpressionSync,
  type RuntimeBindingResolutionContext,
  type RuntimeBindingResultWriter,
} from './runtimeBindings';

export interface RuntimeRepeatResolutionContext extends RuntimeBindingResolutionContext {
  readonly node: UiNode;
  readonly writeResultSlot?: RuntimeBindingResultWriter;
}

export interface RuntimeRepeatItemsResult {
  readonly items: readonly BindingValue[];
  readonly diagnostics: readonly DataSourceDiagnostic[];
}

export interface RuntimeRepeatItemsSyncResult extends RuntimeRepeatItemsResult {
  readonly status: 'ready' | 'pending';
}

/*** Resolves an already materialized repeat expression for the current render pass. */
export function resolveRuntimeRepeatItemsSync(
  repeat: UiNodeRepeatSpec,
  context: RuntimeRepeatResolutionContext,
): RuntimeRepeatItemsSyncResult {
  const diagnostics: DataSourceDiagnostic[] = [];
  const value = resolveRuntimeBindingExpressionSync(repeat.source, context, diagnostics);
  if (value !== undefined || context.executeCapability === undefined) {
    return { status: 'ready', ...finalizeRuntimeRepeatItems(repeat, value, diagnostics) };
  }
  return { status: 'pending', diagnostics, items: [] };
}

/*** Resolves a repeat expression asynchronously through the canonical capability executor. */
export async function resolveRuntimeRepeatItemsAsync(
  repeat: UiNodeRepeatSpec,
  context: RuntimeRepeatResolutionContext,
): Promise<RuntimeRepeatItemsResult> {
  const diagnostics: DataSourceDiagnostic[] = [];
  const value = await resolveRuntimeBindingExpression(repeat.source, context, diagnostics);
  return finalizeRuntimeRepeatItems(repeat, value, diagnostics);
}

/*** Adds one repeat item under its configured alias without discarding outer context values. */
export function createRuntimeRepeatBindingContext(args: {
  readonly baseContext?: Record<string, unknown>;
  readonly item: BindingValue;
  readonly itemAlias?: string;
}): Record<string, unknown> {
  return { ...(args.baseContext ?? {}), [args.itemAlias ?? 'item']: args.item };
}

/*** Selects a stable primitive key from the repeat item, falling back to its index. */
export function resolveRuntimeRepeatItemKey(args: {
  readonly item: BindingValue;
  readonly itemAlias?: string;
  readonly index: number;
  readonly keyPath?: string;
}): string | number {
  return (
    readRepeatPrimitive(args.item, args.keyPath ?? 'id') ??
    readRepeatPrimitive(args.item, 'id') ??
    readRepeatPrimitive(args.item, 'itemId') ??
    args.index
  );
}

function finalizeRuntimeRepeatItems(
  repeat: UiNodeRepeatSpec,
  value: BindingValue | undefined,
  diagnostics: readonly DataSourceDiagnostic[],
): RuntimeRepeatItemsResult {
  if (Array.isArray(value)) return { diagnostics, items: value };
  return {
    diagnostics: [
      ...diagnostics,
      {
        code: 'invalid-config',
        message: 'Repeat source must resolve to an array.',
        severity: 'error',
      },
    ],
    items: [],
  };
}

function readRepeatPrimitive(value: BindingValue, path: string): string | number | undefined {
  const resolved = path.split('.').reduce<unknown>((current, part) => {
    if (typeof current !== 'object' || current === null || Array.isArray(current)) return undefined;
    return (current as Record<string, unknown>)[part];
  }, value);
  return typeof resolved === 'string' || typeof resolved === 'number' ? resolved : undefined;
}
