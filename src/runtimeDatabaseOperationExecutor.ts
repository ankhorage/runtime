import type {
  BindingValue,
  DataOperationConfig,
  DataSourceConfig,
  DataSourceDiagnostic,
  DbAdapter,
  DbFilter,
  DbRecord,
} from '@ankhorage/contracts';

import type { RuntimeBindingOperationExecutionResult } from './runtimeBindings';

export async function executeRuntimeDatabaseOperation(args: {
  readonly dataSource: DataSourceConfig;
  readonly operation: DataOperationConfig;
  readonly input: Readonly<Record<string, BindingValue>> | undefined;
  readonly databaseAdapters: Readonly<Record<string, DbAdapter>> | undefined;
}): Promise<RuntimeBindingOperationExecutionResult> {
  const plan = resolveOperationPlan(args.dataSource, args.operation);
  if (!plan.ok) return plan.result;

  const adapter = args.databaseAdapters?.[plan.adapterId];
  if (adapter === undefined) {
    return failure(
      args,
      'missing-adapter',
      `Database adapter '${plan.adapterId}' is not available.`,
    );
  }

  const input = args.input ?? {};
  switch (plan.operation) {
    case 'list':
      return executeList(adapter, plan, input, args);
    case 'read':
      return executeRead(adapter, plan, input, args);
    case 'create':
      return executeCreate(adapter, plan, input, args);
    case 'update':
      return executeUpdate(adapter, plan, input, args);
    case 'delete':
      return executeDelete(adapter, plan, input, args);
  }
}

type GeneratedCrudOperation = 'list' | 'read' | 'create' | 'update' | 'delete';

interface DatabaseOperationPlan {
  readonly adapterId: string;
  readonly collection: string;
  readonly schema?: string;
  readonly operation: GeneratedCrudOperation;
  readonly primaryKey?: string;
}

type OperationPlanResult =
  | {
      readonly ok: true;
      readonly adapterId: string;
      readonly collection: string;
      readonly schema?: string;
      readonly operation: GeneratedCrudOperation;
      readonly primaryKey?: string;
    }
  | { readonly ok: false; readonly result: RuntimeBindingOperationExecutionResult };

function resolveOperationPlan(
  dataSource: DataSourceConfig,
  operation: DataOperationConfig,
): OperationPlanResult {
  const metadata = asRecord(operation.metadata);
  const adapterId = resolveAdapterId(dataSource);
  const collection = metadata?.collection;
  const operationKind = metadata?.operation;
  const schema = metadata?.schema;

  if (adapterId === undefined) {
    return invalidPlan(
      dataSource,
      operation,
      'Database operation source does not reference an adapter.',
    );
  }
  if (typeof collection !== 'string' || collection.trim().length === 0) {
    return invalidPlan(dataSource, operation, 'Database operation metadata requires a collection.');
  }
  if (!isGeneratedCrudOperation(operationKind)) {
    return invalidPlan(
      dataSource,
      operation,
      'Database operation metadata requires a generated CRUD operation.',
    );
  }
  if (schema !== undefined && schema !== null && typeof schema !== 'string') {
    return invalidPlan(
      dataSource,
      operation,
      'Database operation schema metadata must be a string or null.',
    );
  }

  const metadataAdapterId = metadata?.adapterId;
  if (metadataAdapterId !== undefined && metadataAdapterId !== adapterId) {
    return invalidPlan(
      dataSource,
      operation,
      'Database operation adapter metadata does not match its data source.',
    );
  }

  return {
    ok: true,
    adapterId,
    collection,
    schema: typeof schema === 'string' ? schema : undefined,
    operation: operationKind,
    primaryKey: resolvePrimaryKey(operation),
  };
}

async function executeList(
  adapter: DbAdapter,
  plan: DatabaseOperationPlan,
  input: Readonly<Record<string, BindingValue>>,
  args: DatabaseExecutionArgs,
): Promise<RuntimeBindingOperationExecutionResult> {
  const page = resolvePage(input);
  if (!page.ok) return failure(args, 'invalid-config', page.message);

  const result = await adapter.select({
    table: plan.collection,
    schema: plan.schema,
    page: page.value,
  });
  return resolveDbResult(args, result, (records) => records);
}

async function executeRead(
  adapter: DbAdapter,
  plan: DatabaseOperationPlan,
  input: Readonly<Record<string, BindingValue>>,
  args: DatabaseExecutionArgs,
): Promise<RuntimeBindingOperationExecutionResult> {
  const identity = resolveIdentity(plan, input);
  if (!identity.ok) return failure(args, 'invalid-config', identity.message);

  const result = await adapter.findById({
    table: plan.collection,
    schema: plan.schema,
    id: identity.value,
    idField: plan.primaryKey,
  });
  return resolveDbResult(args, result, (record) => record);
}

async function executeCreate(
  adapter: DbAdapter,
  plan: DatabaseOperationPlan,
  input: Readonly<Record<string, BindingValue>>,
  args: DatabaseExecutionArgs,
): Promise<RuntimeBindingOperationExecutionResult> {
  const result = await adapter.insert({
    table: plan.collection,
    schema: plan.schema,
    values: { ...input },
  });
  return resolveDbResult(args, result, (records) => records[0] ?? null);
}

async function executeUpdate(
  adapter: DbAdapter,
  plan: DatabaseOperationPlan,
  input: Readonly<Record<string, BindingValue>>,
  args: DatabaseExecutionArgs,
): Promise<RuntimeBindingOperationExecutionResult> {
  const identity = resolveIdentity(plan, input);
  if (!identity.ok) return failure(args, 'invalid-config', identity.message);

  const values = omitKey(input, plan.primaryKey);
  if (Object.keys(values).length === 0) {
    return failure(
      args,
      'invalid-config',
      'Generated update operation requires at least one value to update.',
    );
  }

  const result = await adapter.update({
    table: plan.collection,
    schema: plan.schema,
    values,
    filters: [createIdentityFilter(plan.primaryKey, identity.value)],
  });
  return resolveDbResult(args, result, (records) => records[0] ?? null);
}

async function executeDelete(
  adapter: DbAdapter,
  plan: DatabaseOperationPlan,
  input: Readonly<Record<string, BindingValue>>,
  args: DatabaseExecutionArgs,
): Promise<RuntimeBindingOperationExecutionResult> {
  const identity = resolveIdentity(plan, input);
  if (!identity.ok) return failure(args, 'invalid-config', identity.message);

  const result = await adapter.delete({
    table: plan.collection,
    schema: plan.schema,
    filters: [createIdentityFilter(plan.primaryKey, identity.value)],
  });
  return resolveDbResult(args, result, (records) => ({ deleted: records.length > 0 }));
}

type DatabaseExecutionArgs = Pick<
  Parameters<typeof executeRuntimeDatabaseOperation>[0],
  'dataSource' | 'operation'
>;

function resolveDbResult<TData>(
  args: DatabaseExecutionArgs,
  result:
    | { readonly ok: true; readonly data: TData }
    | { readonly ok: false; readonly error: { readonly message: string } },
  select: (data: TData) => unknown,
): RuntimeBindingOperationExecutionResult {
  if (!result.ok) return failure(args, 'database-operation-failed', result.error.message);

  const value = toBindingValue(select(result.data));
  if (value === undefined) {
    return failure(
      args,
      'invalid-config',
      'Database adapter returned a non-serializable binding value.',
    );
  }
  return { ok: true, data: value, diagnostics: [] };
}

function resolveAdapterId(dataSource: DataSourceConfig): string | undefined {
  if (dataSource.kind === 'database') return dataSource.adapter.id;
  if (dataSource.origin === 'generated') return dataSource.adapter.id;
  return undefined;
}

function resolvePrimaryKey(operation: DataOperationConfig): string | undefined {
  return operation.request?.parameters?.find((parameter) => parameter.location === 'path')?.name;
}

function resolveIdentity(
  plan: DatabaseOperationPlan,
  input: Readonly<Record<string, BindingValue>>,
):
  | { readonly ok: true; readonly value: string | number }
  | { readonly ok: false; readonly message: string } {
  if (plan.primaryKey === undefined) {
    return {
      ok: false,
      message: 'Generated read/update/delete operation requires primary-key metadata.',
    };
  }
  const value = input[plan.primaryKey];
  return typeof value === 'string' || (typeof value === 'number' && Number.isFinite(value))
    ? { ok: true, value }
    : {
        ok: false,
        message: `Generated operation requires '${plan.primaryKey}' as a string or number.`,
      };
}

function resolvePage(input: Readonly<Record<string, BindingValue>>):
  | {
      readonly ok: true;
      readonly value: { readonly limit?: number; readonly offset?: number } | undefined;
    }
  | { readonly ok: false; readonly message: string } {
  const { limit, offset } = input;
  if (!isOptionalPageNumber(limit) || !isOptionalPageNumber(offset)) {
    return {
      ok: false,
      message: 'Generated list operation limit/offset must be non-negative integers.',
    };
  }
  if (limit === undefined && offset === undefined) return { ok: true, value: undefined };
  return { ok: true, value: { limit, offset } };
}

function isOptionalPageNumber(value: BindingValue | undefined): value is number | undefined {
  return (
    value === undefined || (typeof value === 'number' && Number.isInteger(value) && value >= 0)
  );
}

function createIdentityFilter(field: string | undefined, value: string | number): DbFilter {
  return { field: field ?? 'id', operator: 'eq', value };
}

function omitKey(input: Readonly<Record<string, BindingValue>>, key: string | undefined): DbRecord {
  const values: DbRecord = {};
  for (const [field, value] of Object.entries(input)) {
    if (field !== key) values[field] = value;
  }
  return values;
}

function isGeneratedCrudOperation(value: unknown): value is GeneratedCrudOperation {
  return (
    value === 'list' ||
    value === 'read' ||
    value === 'create' ||
    value === 'update' ||
    value === 'delete'
  );
}

function invalidPlan(
  dataSource: DataSourceConfig,
  operation: DataOperationConfig,
  message: string,
): OperationPlanResult {
  return {
    ok: false,
    result: failure({ dataSource, operation }, 'invalid-config', message),
  };
}

function failure(
  args: DatabaseExecutionArgs,
  code: string,
  message: string,
): RuntimeBindingOperationExecutionResult {
  const diagnostic: DataSourceDiagnostic = {
    code,
    dataSourceId: args.dataSource.id,
    endpointId: args.operation.endpointId,
    operationId: args.operation.id,
    message,
    severity: 'error',
  };
  return { ok: false, diagnostics: [diagnostic] };
}

function asRecord(value: unknown): Readonly<Record<string, unknown>> | undefined {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Readonly<Record<string, unknown>>)
    : undefined;
}

function toBindingValue(value: unknown): BindingValue | undefined {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
  if (Array.isArray(value)) {
    const items: BindingValue[] = [];
    for (const item of value) {
      const converted = toBindingValue(item);
      if (converted === undefined) return undefined;
      items.push(converted);
    }
    return items;
  }
  const record = asRecord(value);
  if (record === undefined) return undefined;
  const converted: Record<string, BindingValue> = {};
  for (const [key, item] of Object.entries(record)) {
    const bindingValue = toBindingValue(item);
    if (bindingValue === undefined) return undefined;
    converted[key] = bindingValue;
  }
  return converted;
}
