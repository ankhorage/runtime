import type {
  BindingValue,
  DataSourceDiagnostic,
  UiNode,
  UiNodeRepeatSpec,
} from '@ankhorage/contracts';

import {
  applyRuntimeBindingDataPath,
  createRuntimeBindingOperationKey,
  resolveRuntimeBindingOperationSelection,
  resolveRuntimeBindingValueSourceSync,
  type RuntimeBindingOperationResultWriter,
  type RuntimeBindingResolutionContext,
} from './runtimeBindings';

export interface RuntimeRepeatResolutionContext extends RuntimeBindingResolutionContext {
  readonly node: UiNode;
  readonly writeOperationResult?: RuntimeBindingOperationResultWriter;
}

export interface RuntimeRepeatItemsResult {
  readonly items: readonly BindingValue[];
  readonly diagnostics: readonly DataSourceDiagnostic[];
}

export interface RuntimeRepeatItemsSyncResult extends RuntimeRepeatItemsResult {
  readonly status: 'ready' | 'pending';
}

export function resolveRuntimeRepeatItemsSync(
  repeat: UiNodeRepeatSpec,
  context: RuntimeRepeatResolutionContext,
): RuntimeRepeatItemsSyncResult {
  if (repeat.source.kind !== 'operation') {
    const diagnostics: DataSourceDiagnostic[] = [];
    const resolved = resolveRuntimeBindingValueSourceSync(repeat.source, context, diagnostics);
    return {
      status: 'ready',
      ...finalizeRuntimeRepeatItems(repeat, resolved, diagnostics),
    };
  }

  const operationKey = createRuntimeBindingOperationKey(repeat.source.operation);
  const cached = context.operationResults?.[operationKey];
  if (cached !== undefined) {
    return {
      status: 'ready',
      ...finalizeRuntimeRepeatItems(
        repeat,
        applyRuntimeBindingDataPath(cached, repeat.source.path),
        [],
      ),
    };
  }

  if (context.executeOperation !== undefined) {
    return {
      status: 'pending',
      items: [],
      diagnostics: [],
    };
  }

  return {
    status: 'ready',
    items: [],
    diagnostics: [
      createRepeatDiagnostic(
        repeat,
        'missing-adapter',
        'Repeat operation source requires an injected operation executor.',
      ),
    ],
  };
}

export async function resolveRuntimeRepeatItemsAsync(
  repeat: UiNodeRepeatSpec,
  context: RuntimeRepeatResolutionContext,
): Promise<RuntimeRepeatItemsResult> {
  if (repeat.source.kind !== 'operation') {
    const diagnostics: DataSourceDiagnostic[] = [];
    const resolved = await Promise.resolve(
      resolveRuntimeBindingValueSourceSync(repeat.source, context, diagnostics),
    );
    return finalizeRuntimeRepeatItems(repeat, resolved, diagnostics);
  }

  const operationKey = createRuntimeBindingOperationKey(repeat.source.operation);
  const cached = context.operationResults?.[operationKey];
  if (cached !== undefined) {
    return finalizeRuntimeRepeatItems(
      repeat,
      applyRuntimeBindingDataPath(cached, repeat.source.path),
      [],
    );
  }

  if (context.executeOperation === undefined) {
    return {
      items: [],
      diagnostics: [
        createRepeatDiagnostic(
          repeat,
          'missing-adapter',
          'Repeat operation source requires an injected operation executor.',
        ),
      ],
    };
  }

  const diagnostics: DataSourceDiagnostic[] = [];
  const selection = resolveRuntimeBindingOperationSelection(
    repeat.source.operation,
    context.dataSources,
    diagnostics,
  );
  if (selection === undefined) {
    return { items: [], diagnostics };
  }

  const result = await context.executeOperation({
    operation: repeat.source.operation,
    dataSource: selection.dataSource,
    endpoint: selection.endpoint,
    node: context.node,
  });
  diagnostics.push(...(result.diagnostics ?? []));

  if (!result.ok) {
    return { items: [], diagnostics };
  }

  context.writeOperationResult?.(operationKey, result.data);
  return finalizeRuntimeRepeatItems(
    repeat,
    applyRuntimeBindingDataPath(result.data, repeat.source.path),
    diagnostics,
  );
}

export function createRuntimeRepeatBindingContext(args: {
  readonly baseContext?: Record<string, unknown>;
  readonly item: BindingValue;
  readonly itemAlias?: string;
}): Record<string, unknown> {
  return {
    ...(args.baseContext ?? {}),
    [args.itemAlias ?? 'item']: args.item,
  };
}

export function resolveRuntimeRepeatItemKey(args: {
  readonly item: BindingValue;
  readonly itemAlias?: string;
  readonly index: number;
  readonly keyPath?: string;
}): string | number {
  const explicitKey = readRepeatPrimitive(args.item, args.keyPath ?? 'id');
  if (explicitKey !== undefined) {
    return explicitKey;
  }

  const fallbackId = readRepeatPrimitive(args.item, 'id');
  if (fallbackId !== undefined) {
    return fallbackId;
  }

  const fallbackItemId = readRepeatPrimitive(args.item, 'itemId');
  if (fallbackItemId !== undefined) {
    return fallbackItemId;
  }

  return args.index;
}

function finalizeRuntimeRepeatItems(
  repeat: UiNodeRepeatSpec,
  value: BindingValue | undefined,
  diagnostics: readonly DataSourceDiagnostic[],
): RuntimeRepeatItemsResult {
  if (Array.isArray(value)) {
    return {
      items: value,
      diagnostics,
    };
  }

  return {
    items: [],
    diagnostics: [
      ...diagnostics,
      createRepeatDiagnostic(repeat, 'invalid-config', 'Repeat source must resolve to an array.'),
    ],
  };
}

function createRepeatDiagnostic(
  repeat: UiNodeRepeatSpec,
  code: DataSourceDiagnostic['code'],
  message: string,
): DataSourceDiagnostic {
  return {
    code,
    dataSourceId:
      repeat.source.kind === 'operation' ? repeat.source.operation.dataSourceId : undefined,
    endpointId: repeat.source.kind === 'operation' ? repeat.source.operation.endpointId : undefined,
    operationId:
      repeat.source.kind === 'operation' ? repeat.source.operation.operationId : undefined,
    message,
    severity: 'error',
  };
}

function readRepeatPrimitive(value: BindingValue, path: string): string | number | undefined {
  const resolved = path.split('.').reduce<unknown>((currentValue, part) => {
    if (typeof currentValue !== 'object' || currentValue === null || Array.isArray(currentValue)) {
      return undefined;
    }

    return (currentValue as Record<string, unknown>)[part];
  }, value);

  if (typeof resolved === 'string' || typeof resolved === 'number') {
    return resolved;
  }

  return undefined;
}
