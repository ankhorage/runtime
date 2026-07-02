import type {
  BindingFallback,
  BindingInputMap,
  BindingInputValue,
  BindingOperationRef,
  BindingValue,
  BindingValueSource,
  BindingValueTransform,
  ComponentDataBindingRegistry,
  ComponentEventDto,
  DataEndpointConfig,
  DataSourceConfig,
  DataSourceDiagnostic,
  DataSourceRegistry,
  PropBinding,
  StateAdapter,
  UiNode,
} from '@ankhorage/contracts';

export type RuntimeBindingOperationKey = string;

export interface RuntimeBindingOperationExecutionArgs {
  readonly operation: BindingOperationRef;
  readonly dataSource: DataSourceConfig;
  readonly endpoint?: DataEndpointConfig;
  readonly input?: BindingValue;
  readonly node?: UiNode;
}

export type RuntimeBindingOperationExecutionResult =
  | {
      readonly ok: true;
      readonly data: BindingValue;
      readonly diagnostics?: readonly DataSourceDiagnostic[];
    }
  | {
      readonly ok: false;
      readonly diagnostics: readonly DataSourceDiagnostic[];
    };

export type RuntimeBindingOperationExecutor = (
  args: RuntimeBindingOperationExecutionArgs,
) => Promise<RuntimeBindingOperationExecutionResult>;

export type RuntimeBindingOperationResultCache = Readonly<
  Record<RuntimeBindingOperationKey, BindingValue | undefined>
>;

export type RuntimeBindingOperationResultWriter = (
  key: RuntimeBindingOperationKey,
  value: BindingValue,
) => void;

export interface RuntimeBindingResolutionContext {
  readonly context?: Record<string, unknown>;
  readonly event?: ComponentEventDto<string, object>;
  readonly stateAdapter?: StateAdapter;
  readonly dataSources?: DataSourceRegistry;
  readonly dataBindings?: ComponentDataBindingRegistry;
  readonly operationResults?: RuntimeBindingOperationResultCache;
  readonly executeOperation?: RuntimeBindingOperationExecutor;
}

export interface RuntimeBindingResolutionArgs extends RuntimeBindingResolutionContext {
  readonly node: UiNode;
  readonly props: Record<string, unknown>;
}

export interface RuntimeBindingResolutionResult {
  readonly props: Record<string, unknown>;
  readonly diagnostics: readonly DataSourceDiagnostic[];
}

export async function resolveRuntimeBindingsAsync(
  args: RuntimeBindingResolutionArgs,
): Promise<RuntimeBindingResolutionResult> {
  const diagnostics: DataSourceDiagnostic[] = [];
  const resolvedProps: Record<string, unknown> = { ...args.props };
  const binding = args.dataBindings?.[args.node.id];

  for (const [prop, propBinding] of Object.entries(binding?.props ?? {})) {
    const value = await resolveRuntimeBindingValue(propBinding, args, diagnostics);
    resolvedProps[prop] = value;
  }

  return { props: resolvedProps, diagnostics };
}

export function resolveRuntimeBindings(
  args: RuntimeBindingResolutionArgs,
): RuntimeBindingResolutionResult {
  const diagnostics: DataSourceDiagnostic[] = [];
  const resolvedProps: Record<string, unknown> = { ...args.props };
  const binding = args.dataBindings?.[args.node.id];

  for (const [prop, propBinding] of Object.entries(binding?.props ?? {})) {
    resolvedProps[prop] = resolveRuntimeBindingValueSync(propBinding, args, diagnostics);
  }

  return { props: resolvedProps, diagnostics };
}

export async function resolveRuntimeBindingValue(
  binding: PropBinding,
  context: RuntimeBindingResolutionContext,
  diagnostics: DataSourceDiagnostic[] = [],
): Promise<unknown> {
  const value = await resolveRuntimeBindingValueSource(binding.source, context, diagnostics);
  const transformedValue = applyBindingValueTransforms(value, binding.transforms);

  if (transformedValue !== undefined) return transformedValue;

  return resolveBindingFallback(binding.fallback, context, diagnostics);
}

export function resolveRuntimeBindingValueSync(
  binding: PropBinding,
  context: RuntimeBindingResolutionContext,
  diagnostics: DataSourceDiagnostic[] = [],
): unknown {
  const value = resolveRuntimeBindingValueSourceSync(binding.source, context, diagnostics);
  const transformedValue = applyBindingValueTransforms(value, binding.transforms);

  if (transformedValue !== undefined) return transformedValue;

  return resolveBindingFallbackSync(binding.fallback, context, diagnostics);
}

export async function resolveBindingInputMap(
  input: BindingInputMap | undefined,
  context: RuntimeBindingResolutionContext,
  diagnostics: DataSourceDiagnostic[] = [],
): Promise<BindingValue | undefined> {
  if (input === undefined) return undefined;

  const fields: Record<string, BindingValue> = {};

  for (const [key, value] of Object.entries(input)) {
    const resolvedValue = await resolveBindingInputValue(value, context, diagnostics);
    if (resolvedValue !== undefined) fields[key] = resolvedValue;
  }

  return fields;
}

export function resolveBindingInputMapSync(
  input: BindingInputMap | undefined,
  context: RuntimeBindingResolutionContext,
  diagnostics: DataSourceDiagnostic[] = [],
): BindingValue | undefined {
  if (input === undefined) return undefined;

  const fields: Record<string, BindingValue> = {};

  for (const [key, value] of Object.entries(input)) {
    const resolvedValue = resolveBindingInputValueSync(value, context, diagnostics);
    if (resolvedValue !== undefined) fields[key] = resolvedValue;
  }

  return fields;
}

export function createRuntimeBindingOperationKey(
  operation: BindingOperationRef,
): RuntimeBindingOperationKey {
  return [operation.dataSourceId, operation.endpointId ?? '', operation.operationId].join(':');
}

export function validateRuntimeBindingOperationRef(
  operation: BindingOperationRef,
  dataSources: DataSourceRegistry | undefined,
): readonly DataSourceDiagnostic[] {
  const dataSource = dataSources?.[operation.dataSourceId];
  if (dataSource === undefined) {
    return [
      createRuntimeBindingDiagnostic({
        code: 'missing-data-source',
        message: `Data source '${operation.dataSourceId}' could not be found.`,
        operation,
      }),
    ];
  }

  const endpoint = resolveRuntimeBindingEndpoint(operation, dataSource);
  if (endpoint === undefined) {
    return [
      createRuntimeBindingDiagnostic({
        code: 'missing-endpoint',
        dataSourceId: operation.dataSourceId,
        message: `Endpoint '${operation.endpointId ?? '<default>'}' could not be found.`,
        operation,
      }),
    ];
  }

  if (endpoint.operations[operation.operationId] === undefined) {
    return [
      createRuntimeBindingDiagnostic({
        code: 'missing-operation',
        dataSourceId: operation.dataSourceId,
        endpointId: endpoint.id,
        message: `Operation '${operation.operationId}' could not be found.`,
        operation,
      }),
    ];
  }

  return [];
}

async function resolveRuntimeBindingValueSource(
  source: BindingValueSource,
  context: RuntimeBindingResolutionContext,
  diagnostics: DataSourceDiagnostic[],
): Promise<BindingValue | undefined> {
  if (source.kind !== 'operation') {
    return resolveRuntimeBindingValueSourceSync(source, context, diagnostics);
  }

  const cached = resolveCachedOperationValue(source, context);
  if (cached !== undefined) return cached;

  if (context.executeOperation === undefined) {
    diagnostics.push(
      createRuntimeBindingDiagnostic({
        code: 'missing-adapter',
        message: 'Operation binding requires an injected operation executor.',
        operation: source.operation,
      }),
    );
    return undefined;
  }

  const selection = resolveRuntimeBindingOperationSelection(
    source.operation,
    context.dataSources,
    diagnostics,
  );
  if (selection === undefined) return undefined;

  const result = await context.executeOperation({
    operation: source.operation,
    dataSource: selection.dataSource,
    endpoint: selection.endpoint,
  });

  diagnostics.push(...(result.diagnostics ?? []));
  if (!result.ok) return undefined;

  return applyRuntimeBindingDataPath(result.data, source.path);
}

export function resolveRuntimeBindingValueSourceSync(
  source: BindingValueSource,
  context: RuntimeBindingResolutionContext,
  diagnostics: DataSourceDiagnostic[],
): BindingValue | undefined {
  switch (source.kind) {
    case 'context':
      return asBindingValue(readPath(context.context, source.path));
    case 'event':
      return asBindingValue(readPath(context.event, source.path));
    case 'literal':
      return source.value;
    case 'operation': {
      const cached = resolveCachedOperationValue(source, context);
      if (cached !== undefined) return cached;
      diagnostics.push(
        createRuntimeBindingDiagnostic({
          code: 'missing-adapter',
          message: 'Synchronous operation bindings require preloaded operation results.',
          operation: source.operation,
        }),
      );
      return undefined;
    }
    case 'state': {
      const result = context.stateAdapter?.get(source.path);
      return result?.ok ? asBindingValue(result.data) : undefined;
    }
  }
}

function resolveCachedOperationValue(
  source: Extract<BindingValueSource, { readonly kind: 'operation' }>,
  context: RuntimeBindingResolutionContext,
): BindingValue | undefined {
  const operationKey = createRuntimeBindingOperationKey(source.operation);
  const cachedValue = context.operationResults?.[operationKey];

  return applyRuntimeBindingDataPath(cachedValue, source.path);
}

async function resolveBindingFallback(
  fallback: BindingFallback | undefined,
  context: RuntimeBindingResolutionContext,
  diagnostics: DataSourceDiagnostic[],
): Promise<unknown> {
  if (fallback === undefined) return undefined;
  if (fallback.value !== undefined) return fallback.value;
  if (fallback.source === undefined) return undefined;

  return resolveRuntimeBindingValueSource(fallback.source, context, diagnostics);
}

function resolveBindingFallbackSync(
  fallback: BindingFallback | undefined,
  context: RuntimeBindingResolutionContext,
  diagnostics: DataSourceDiagnostic[],
): unknown {
  if (fallback === undefined) return undefined;
  if (fallback.value !== undefined) return fallback.value;
  if (fallback.source === undefined) return undefined;

  return resolveRuntimeBindingValueSourceSync(fallback.source, context, diagnostics);
}

async function resolveBindingInputValue(
  input: BindingInputValue,
  context: RuntimeBindingResolutionContext,
  diagnostics: DataSourceDiagnostic[],
): Promise<BindingValue | undefined> {
  if (input.kind === 'literal') return input.value;
  if (input.kind === 'source') {
    const value = await resolveRuntimeBindingValueSource(input.source, context, diagnostics);
    return applyBindingValueTransforms(value, input.transforms);
  }

  if (input.kind === 'array') {
    const items: BindingValue[] = [];

    for (const item of input.items) {
      const value = await resolveBindingInputValue(item, context, diagnostics);
      if (value !== undefined) items.push(value);
    }

    return items;
  }

  const fields: Record<string, BindingValue> = {};

  for (const [key, value] of Object.entries(input.fields)) {
    const resolvedValue = await resolveBindingInputValue(value, context, diagnostics);
    if (resolvedValue !== undefined) fields[key] = resolvedValue;
  }

  return fields;
}

function resolveBindingInputValueSync(
  input: BindingInputValue,
  context: RuntimeBindingResolutionContext,
  diagnostics: DataSourceDiagnostic[],
): BindingValue | undefined {
  if (input.kind === 'literal') return input.value;
  if (input.kind === 'source') {
    const value = resolveRuntimeBindingValueSourceSync(input.source, context, diagnostics);
    return applyBindingValueTransforms(value, input.transforms);
  }

  if (input.kind === 'array') {
    const items: BindingValue[] = [];

    for (const item of input.items) {
      const value = resolveBindingInputValueSync(item, context, diagnostics);
      if (value !== undefined) items.push(value);
    }

    return items;
  }

  const fields: Record<string, BindingValue> = {};

  for (const [key, value] of Object.entries(input.fields)) {
    const resolvedValue = resolveBindingInputValueSync(value, context, diagnostics);
    if (resolvedValue !== undefined) fields[key] = resolvedValue;
  }

  return fields;
}

export function resolveRuntimeBindingOperationSelection(
  operation: BindingOperationRef,
  dataSources: DataSourceRegistry | undefined,
  diagnostics: DataSourceDiagnostic[],
): { readonly dataSource: DataSourceConfig; readonly endpoint?: DataEndpointConfig } | undefined {
  const validationDiagnostics = validateRuntimeBindingOperationRef(operation, dataSources);
  diagnostics.push(...validationDiagnostics);
  if (validationDiagnostics.length > 0) return undefined;

  const dataSource = dataSources?.[operation.dataSourceId];
  if (dataSource === undefined) return undefined;

  return {
    dataSource,
    endpoint: resolveRuntimeBindingEndpoint(operation, dataSource),
  };
}

function resolveRuntimeBindingEndpoint(
  operation: BindingOperationRef,
  dataSource: DataSourceConfig,
): DataEndpointConfig | undefined {
  if (operation.endpointId !== undefined) return dataSource.endpoints[operation.endpointId];

  return Object.values(dataSource.endpoints).find(
    (endpoint) => endpoint.operations[operation.operationId] !== undefined,
  );
}

function createRuntimeBindingDiagnostic(args: {
  readonly code: DataSourceDiagnostic['code'];
  readonly message: string;
  readonly operation: BindingOperationRef;
  readonly dataSourceId?: string;
  readonly endpointId?: string;
}): DataSourceDiagnostic {
  return {
    code: args.code,
    dataSourceId: args.dataSourceId ?? args.operation.dataSourceId,
    endpointId: args.endpointId ?? args.operation.endpointId,
    operationId: args.operation.operationId,
    message: args.message,
    severity: 'error',
  };
}

function applyBindingValueTransforms(
  value: unknown,
  transforms: readonly BindingValueTransform[] | undefined,
): BindingValue | undefined {
  const bindingValue = asBindingValue(value);
  if (typeof bindingValue !== 'string' || transforms === undefined) return bindingValue;

  let currentValue = bindingValue;

  for (const transform of transforms) {
    if (transform === 'lowercase') currentValue = currentValue.toLowerCase();
    if (transform === 'trim') currentValue = currentValue.trim();
    if (transform === 'uppercase') currentValue = currentValue.toUpperCase();
  }

  return currentValue;
}

export function applyRuntimeBindingDataPath(
  value: BindingValue | undefined,
  path: string | undefined,
): BindingValue | undefined {
  if (path === undefined) return value;
  return asBindingValue(readPath(value, path));
}

function readPath(source: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((currentValue, part) => {
    if (Array.isArray(currentValue)) {
      if (!isArrayIndexPathPart(part)) return undefined;
      return currentValue[Number(part)];
    }

    if (!isRecord(currentValue)) return undefined;
    return currentValue[part];
  }, source);
}

function isArrayIndexPathPart(part: string): boolean {
  return /^(0|[1-9]\d*)$/.test(part);
}

function asBindingValue(value: unknown): BindingValue | undefined {
  return isBindingValue(value) ? value : undefined;
}

function isBindingValue(value: unknown): value is BindingValue {
  if (value === null) return true;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return true;
  }

  if (Array.isArray(value)) return value.every(isBindingValue);
  if (!isRecord(value)) return false;

  return Object.values(value).every(isBindingValue);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
