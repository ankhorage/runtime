import type {
  BindingCapabilityReference,
  BindingExpression,
  BindingInputMap,
  BindingInvocation,
  BindingValue,
  BindingValueTransform,
  ComponentDataBindingRegistry,
  ComponentEventDto,
  DataSourceDiagnostic,
  PropBinding,
  StateAdapter,
  UiNode,
} from '@ankhorage/contracts';
import type { Capability } from '@ankhorage/contracts/capability';
import { isRecord } from '@ankhorage/utility/object';

export type RuntimeBindingResultCache = Readonly<Record<string, BindingValue | undefined>>;
export type RuntimeBindingResultWriter = (slot: string, value: BindingValue) => void;

export interface RuntimeCapabilityExecutionArgs {
  readonly capability: Capability['id'];
  readonly input?: BindingValue;
  readonly node?: UiNode;
  readonly event?: ComponentEventDto<string, object>;
}

export type RuntimeCapabilityExecutionResult =
  | {
      readonly ok: true;
      readonly data: BindingValue;
      readonly diagnostics?: readonly DataSourceDiagnostic[];
    }
  | { readonly ok: false; readonly diagnostics: readonly DataSourceDiagnostic[] };

export type RuntimeCapabilityExecutor = (
  args: RuntimeCapabilityExecutionArgs,
) => Promise<RuntimeCapabilityExecutionResult>;

export interface RuntimeBindingResolutionContext {
  readonly context?: Record<string, unknown>;
  readonly event?: ComponentEventDto<string, object>;
  readonly stateAdapter?: StateAdapter;
  readonly capabilityValues?: Readonly<Record<string, BindingValue | undefined>>;
  readonly dataBindings?: ComponentDataBindingRegistry;
  readonly resultSlots?: RuntimeBindingResultCache;
  readonly executeCapability?: RuntimeCapabilityExecutor;
  readonly writeResultSlot?: RuntimeBindingResultWriter;
}

export interface RuntimeBindingResolutionArgs extends RuntimeBindingResolutionContext {
  readonly node: UiNode;
  readonly props: Record<string, unknown>;
}

export interface RuntimeBindingResolutionResult {
  readonly props: Record<string, unknown>;
  readonly diagnostics: readonly DataSourceDiagnostic[];
}

/*** Resolves every property binding through the canonical expression boundary. */
export async function resolveRuntimeBindingsAsync(
  args: RuntimeBindingResolutionArgs,
): Promise<RuntimeBindingResolutionResult> {
  const diagnostics: DataSourceDiagnostic[] = [];
  const props = { ...args.props };

  for (const [name, binding] of Object.entries(args.dataBindings?.[args.node.id]?.props ?? {})) {
    props[name] = await resolveRuntimeBindingValue(binding, args, diagnostics);
  }

  return { props, diagnostics };
}

/*** Resolves property bindings using only already materialized capability values. */
export function resolveRuntimeBindings(
  args: RuntimeBindingResolutionArgs,
): RuntimeBindingResolutionResult {
  const diagnostics: DataSourceDiagnostic[] = [];
  const props = { ...args.props };

  for (const [name, binding] of Object.entries(args.dataBindings?.[args.node.id]?.props ?? {})) {
    props[name] = resolveRuntimeBindingValueSync(binding, args, diagnostics);
  }

  return { props, diagnostics };
}

/*** Resolves one recursive Contracts expression, executing a capability only when needed. */
export async function resolveRuntimeBindingExpression(
  expression: BindingExpression,
  context: RuntimeBindingResolutionContext,
  diagnostics: DataSourceDiagnostic[] = [],
): Promise<BindingValue | undefined> {
  if (isCapabilityReference(expression)) {
    return resolveCapabilityReferenceAsync(expression, context, diagnostics);
  }
  if (expression.kind === 'literal') return expression.value;
  if (expression.kind === 'array') return resolveArrayAsync(expression.items, context, diagnostics);
  if (expression.kind === 'object')
    return resolveObjectAsync(expression.fields, context, diagnostics);
  if (expression.kind === 'transform') {
    return applyBindingValueTransforms(
      await resolveRuntimeBindingExpression(expression.value, context, diagnostics),
      expression.transforms,
    );
  }

  const value = await resolveRuntimeBindingExpression(expression.value, context, diagnostics);
  return value === undefined
    ? resolveRuntimeBindingExpression(expression.fallback, context, diagnostics)
    : value;
}

/*** Resolves one expression without side effects for synchronous rendering. */
export function resolveRuntimeBindingExpressionSync(
  expression: BindingExpression,
  context: RuntimeBindingResolutionContext,
  diagnostics: DataSourceDiagnostic[] = [],
): BindingValue | undefined {
  if (isCapabilityReference(expression))
    return resolveCapabilityReferenceSync(expression, context, diagnostics);
  if (expression.kind === 'literal') return expression.value;
  if (expression.kind === 'array') return resolveArraySync(expression.items, context, diagnostics);
  if (expression.kind === 'object')
    return resolveObjectSync(expression.fields, context, diagnostics);
  if (expression.kind === 'transform') {
    return applyBindingValueTransforms(
      resolveRuntimeBindingExpressionSync(expression.value, context, diagnostics),
      expression.transforms,
    );
  }

  const value = resolveRuntimeBindingExpressionSync(expression.value, context, diagnostics);
  return value === undefined
    ? resolveRuntimeBindingExpressionSync(expression.fallback, context, diagnostics)
    : value;
}

/*** Resolves a property binding expression. */
export function resolveRuntimeBindingValue(
  binding: PropBinding,
  context: RuntimeBindingResolutionContext,
  diagnostics: DataSourceDiagnostic[] = [],
): Promise<BindingValue | undefined> {
  return resolveRuntimeBindingExpression(binding.value, context, diagnostics);
}

/*** Resolves a property binding expression without executing a capability. */
export function resolveRuntimeBindingValueSync(
  binding: PropBinding,
  context: RuntimeBindingResolutionContext,
  diagnostics: DataSourceDiagnostic[] = [],
): BindingValue | undefined {
  return resolveRuntimeBindingExpressionSync(binding.value, context, diagnostics);
}

/*** Resolves an invocation input map recursively. */
export function resolveBindingInputMap(
  input: BindingInputMap | undefined,
  context: RuntimeBindingResolutionContext,
  diagnostics: DataSourceDiagnostic[] = [],
): Promise<BindingValue | undefined> {
  return input === undefined
    ? Promise.resolve(undefined)
    : resolveObjectAsync(input, context, diagnostics);
}

/*** Resolves an invocation input map without executing a capability. */
export function resolveBindingInputMapSync(
  input: BindingInputMap | undefined,
  context: RuntimeBindingResolutionContext,
  diagnostics: DataSourceDiagnostic[] = [],
): BindingValue | undefined {
  return input === undefined ? undefined : resolveObjectSync(input, context, diagnostics);
}

/*** Invokes one capability and records its structured result under its declared local slot. */
export async function executeRuntimeBindingInvocation(
  invocation: BindingInvocation,
  context: RuntimeBindingResolutionContext,
  args: Pick<RuntimeCapabilityExecutionArgs, 'event' | 'node'> = {},
  diagnostics: DataSourceDiagnostic[] = [],
): Promise<RuntimeCapabilityExecutionResult | undefined> {
  if (context.executeCapability === undefined) {
    diagnostics.push(createMissingCapabilityExecutorDiagnostic(invocation.capability));
    return undefined;
  }

  const input = await resolveBindingInputMap(invocation.input, context, diagnostics);
  const result = await context.executeCapability({
    capability: invocation.capability,
    input,
    ...args,
  });
  diagnostics.push(...(result.diagnostics ?? []));

  if (result.ok && invocation.result !== undefined) {
    context.writeResultSlot?.(invocation.result, result.data);
  }

  return result;
}

/*** Applies a dotted path to a serializable binding value. */
export function applyRuntimeBindingDataPath(
  value: BindingValue | undefined,
  path: string | undefined,
): BindingValue | undefined {
  return path === undefined ? value : asBindingValue(readPath(value, path));
}

function isCapabilityReference(
  expression: BindingExpression,
): expression is BindingCapabilityReference {
  return 'capability' in expression;
}

async function resolveCapabilityReferenceAsync(
  reference: BindingCapabilityReference,
  context: RuntimeBindingResolutionContext,
  diagnostics: DataSourceDiagnostic[],
): Promise<BindingValue | undefined> {
  const cached = resolveCapabilityReferenceSync(reference, context, diagnostics, false);
  if (cached !== undefined || reference.result !== undefined) return cached;
  if (context.executeCapability === undefined) return cached;

  const result = await context.executeCapability({ capability: reference.capability });
  diagnostics.push(...(result.diagnostics ?? []));
  return result.ok ? applyRuntimeBindingDataPath(result.data, reference.path) : undefined;
}

function resolveCapabilityReferenceSync(
  reference: BindingCapabilityReference,
  context: RuntimeBindingResolutionContext,
  diagnostics: DataSourceDiagnostic[],
  reportMissing = true,
): BindingValue | undefined {
  const value =
    reference.result === undefined
      ? resolveReadableCapability(reference.capability, context)
      : context.resultSlots?.[reference.result];
  if (value === undefined && reference.result !== undefined && reportMissing) {
    diagnostics.push({
      code: 'missing-adapter',
      message: `Result slot '${reference.result}' is not available.`,
      severity: 'error',
    });
  }
  return applyRuntimeBindingDataPath(value, reference.path);
}

function resolveReadableCapability(
  capability: string,
  context: RuntimeBindingResolutionContext,
): BindingValue | undefined {
  const explicit = context.capabilityValues?.[capability];
  if (explicit !== undefined) return explicit;
  if (capability.startsWith('context.'))
    return asBindingValue(readPath(context.context, capability.slice(8)));
  if (capability.startsWith('event.'))
    return asBindingValue(readPath(context.event, capability.slice(6)));
  if (capability.startsWith('state.')) {
    const result = context.stateAdapter?.get(capability.slice(6));
    return result?.ok ? asBindingValue(result.data) : undefined;
  }
  return asBindingValue(readPath(context.context, capability));
}

async function resolveArrayAsync(
  items: readonly BindingExpression[],
  context: RuntimeBindingResolutionContext,
  diagnostics: DataSourceDiagnostic[],
): Promise<BindingValue> {
  const values = await Promise.all(
    items.map((item) => resolveRuntimeBindingExpression(item, context, diagnostics)),
  );
  return values.filter((value): value is BindingValue => value !== undefined);
}

function resolveArraySync(
  items: readonly BindingExpression[],
  context: RuntimeBindingResolutionContext,
  diagnostics: DataSourceDiagnostic[],
): BindingValue {
  return items
    .map((item) => resolveRuntimeBindingExpressionSync(item, context, diagnostics))
    .filter((value): value is BindingValue => value !== undefined);
}

async function resolveObjectAsync(
  fields: Readonly<Record<string, BindingExpression>>,
  context: RuntimeBindingResolutionContext,
  diagnostics: DataSourceDiagnostic[],
): Promise<BindingValue> {
  const entries = await Promise.all(
    Object.entries(fields).map(async ([key, expression]) => {
      const value = await resolveRuntimeBindingExpression(expression, context, diagnostics);
      return value === undefined ? undefined : ([key, value] as const);
    }),
  );
  return Object.fromEntries(
    entries.filter((entry): entry is readonly [string, BindingValue] => entry !== undefined),
  );
}

function resolveObjectSync(
  fields: Readonly<Record<string, BindingExpression>>,
  context: RuntimeBindingResolutionContext,
  diagnostics: DataSourceDiagnostic[],
): BindingValue {
  const entries = Object.entries(fields).map(([key, expression]) => {
    const value = resolveRuntimeBindingExpressionSync(expression, context, diagnostics);
    return value === undefined ? undefined : ([key, value] as const);
  });
  return Object.fromEntries(
    entries.filter((entry): entry is readonly [string, BindingValue] => entry !== undefined),
  );
}

function applyBindingValueTransforms(
  value: BindingValue | undefined,
  transforms: readonly BindingValueTransform[],
): BindingValue | undefined {
  if (typeof value !== 'string') return value;
  return transforms.reduce((current, transform) => {
    if (transform === 'trim') return current.trim();
    if (transform === 'uppercase') return current.toUpperCase();
    return current.toLowerCase();
  }, value);
}

function createMissingCapabilityExecutorDiagnostic(capability: string): DataSourceDiagnostic {
  return {
    code: 'missing-adapter',
    message: `Capability '${capability}' requires an injected capability executor.`,
    severity: 'error',
  };
}

function readPath(value: unknown, path: string): unknown {
  if (path.length === 0) return value;
  return path.split('.').reduce<unknown>((current, part) => {
    if (Array.isArray(current))
      return /^(0|[1-9]\\d*)$/.test(part) ? current[Number(part)] : undefined;
    return isRecord(current) ? current[part] : undefined;
  }, value);
}

function asBindingValue(value: unknown): BindingValue | undefined {
  return isBindingValue(value) ? value : undefined;
}

function isBindingValue(value: unknown): value is BindingValue {
  if (value === null || ['boolean', 'number', 'string'].includes(typeof value)) return true;
  if (Array.isArray(value)) return value.every(isBindingValue);
  return isRecord(value) && Object.values(value).every(isBindingValue);
}
