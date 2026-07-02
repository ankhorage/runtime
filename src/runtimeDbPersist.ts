import type {
  DbAdapter,
  DbAdapterError,
  DbInsertInput,
  DbRecord,
  DbResult,
} from '@ankhorage/contracts';

import type { RuntimeActionHandler, RuntimeActionHandlerArgs } from './RuntimeRendererConfig';

export interface RuntimeDbPersistResult {
  readonly input: DbInsertInput;
  readonly result: DbResult<DbRecord[]>;
}

export interface RuntimeDbPersistError {
  readonly code: string;
  readonly message: string;
}

export type RuntimeDbPersistExecutionResult =
  | {
      readonly ok: true;
      readonly data: RuntimeDbPersistResult;
    }
  | {
      readonly ok: false;
      readonly error: RuntimeDbPersistError;
    };

interface FieldValueEntry {
  readonly field: string;
  readonly value: unknown;
}

export function createDbPersistActionHandler(args: {
  readonly dbAdapter: DbAdapter;
  readonly onResult?: (result: RuntimeDbPersistExecutionResult) => void;
}): RuntimeActionHandler {
  const { dbAdapter, onResult } = args;

  return async (handlerArgs) => {
    const result = await executeDbPersistAction({ dbAdapter, handlerArgs });
    onResult?.(result);
  };
}

export async function executeDbPersistAction(args: {
  readonly dbAdapter: DbAdapter;
  readonly handlerArgs: RuntimeActionHandlerArgs;
}): Promise<RuntimeDbPersistExecutionResult> {
  const inputResult = resolveDbPersistInput(args.handlerArgs.resolvedPayload);
  if (!inputResult.ok) {
    return inputResult;
  }

  const result = await args.dbAdapter.insert(inputResult.data);

  return {
    ok: true,
    data: {
      input: inputResult.data,
      result,
    },
  };
}

export function resolveDbPersistInput(payload: object | undefined):
  | {
      readonly ok: true;
      readonly data: DbInsertInput;
    }
  | {
      readonly ok: false;
      readonly error: RuntimeDbPersistError;
    } {
  if (!isRecord(payload)) {
    return createError('invalid_payload', 'db.persist requires a resolved payload object.');
  }

  const { collection } = payload;
  if (typeof collection !== 'string' || collection.trim().length === 0) {
    return createError('missing_collection', 'db.persist requires a non-empty collection.');
  }

  const { values } = payload;
  if (!Array.isArray(values) || values.length === 0) {
    return createError('missing_values', 'db.persist requires at least one value mapping.');
  }

  const record: DbRecord = {};
  for (const value of values) {
    if (!isFieldValueEntry(value)) {
      return createError(
        'invalid_value_mapping',
        'db.persist value mappings must resolve to { field, value } entries.',
      );
    }

    if (value.field.trim().length === 0) {
      return createError('invalid_field', 'db.persist value field must be non-empty.');
    }

    record[value.field] = value.value;
  }

  return {
    ok: true,
    data: {
      table: collection.trim(),
      values: record,
    },
  };
}

function createError(
  code: RuntimeDbPersistError['code'],
  message: RuntimeDbPersistError['message'],
): { readonly ok: false; readonly error: RuntimeDbPersistError } {
  return {
    ok: false,
    error: { code, message },
  };
}

export function createDbPersistAdapterError(error: RuntimeDbPersistError): DbAdapterError {
  return {
    code: error.code,
    message: error.message,
  };
}

function isFieldValueEntry(value: unknown): value is FieldValueEntry {
  if (!isRecord(value)) {
    return false;
  }

  return typeof value.field === 'string' && 'value' in value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
