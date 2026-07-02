import type { DbAdapter, DbInsertInput, DbRecord, DbResult } from '@ankhorage/contracts';
import { describe, expect, it } from 'bun:test';

import { dispatchRuntimeComponentEvent } from './runtimeActionRegistry';
import {
  createDbPersistActionHandler,
  executeDbPersistAction,
  resolveDbPersistInput,
  type RuntimeDbPersistExecutionResult,
} from './runtimeDbPersist';

function createFakeDbAdapter(calls: DbInsertInput[]): DbAdapter {
  return {
    capabilities: {
      realtime: false,
      returning: true,
      transactions: false,
    },
    select<TRecord extends object = DbRecord>(): Promise<DbResult<TRecord[]>> {
      return Promise.resolve({ ok: true, data: [] });
    },
    findById<TRecord extends object = DbRecord>(): Promise<DbResult<TRecord | null>> {
      return Promise.resolve({ ok: true, data: null });
    },
    insert<TRecord extends object = DbRecord>(
      input: DbInsertInput<TRecord>,
    ): Promise<DbResult<TRecord[]>> {
      calls.push(input as DbInsertInput);
      return Promise.resolve({ ok: true, data: [] });
    },
    update<TRecord extends object = DbRecord>(): Promise<DbResult<TRecord[]>> {
      return Promise.resolve({ ok: true, data: [] });
    },
    delete<TRecord extends object = DbRecord>(): Promise<DbResult<TRecord[]>> {
      return Promise.resolve({ ok: true, data: [] });
    },
  };
}

describe('resolveDbPersistInput', () => {
  it('maps resolved field entries to a DbInsertInput', () => {
    const result = resolveDbPersistInput({
      collection: 'contact_messages',
      values: [
        { field: 'firstname', value: 'Fabio' },
        { field: 'message', value: 'Hello' },
      ],
    });

    expect(result).toEqual({
      ok: true,
      data: {
        table: 'contact_messages',
        values: {
          firstname: 'Fabio',
          message: 'Hello',
        },
      },
    });
  });

  it('rejects missing collection', () => {
    const result = resolveDbPersistInput({
      values: [{ field: 'message', value: 'Hello' }],
    });

    expect(result).toEqual({
      ok: false,
      error: {
        code: 'missing_collection',
        message: 'db.persist requires a non-empty collection.',
      },
    });
  });

  it('rejects missing value mappings', () => {
    const result = resolveDbPersistInput({
      collection: 'contact_messages',
      values: [],
    });

    expect(result).toEqual({
      ok: false,
      error: {
        code: 'missing_values',
        message: 'db.persist requires at least one value mapping.',
      },
    });
  });
});

describe('executeDbPersistAction', () => {
  it('calls DbAdapter.insert with the resolved input', async () => {
    const calls: DbInsertInput[] = [];
    const dbAdapter = createFakeDbAdapter(calls);

    const result = await executeDbPersistAction({
      dbAdapter,
      handlerArgs: {
        action: {
          type: 'db.persist',
        },
        resolvedPayload: {
          collection: 'contact_messages',
          values: [
            { field: 'firstname', value: 'Fabio' },
            { field: 'message', value: 'Hello' },
          ],
        },
      },
    });

    expect(calls).toEqual([
      {
        table: 'contact_messages',
        values: {
          firstname: 'Fabio',
          message: 'Hello',
        },
      },
    ]);
    expect(result.ok).toBe(true);
  });

  it('dispatches form.submit db.persist bindings into a fake adapter', async () => {
    const calls: DbInsertInput[] = [];
    const results: RuntimeDbPersistExecutionResult[] = [];
    const dbAdapter = createFakeDbAdapter(calls);

    await dispatchRuntimeComponentEvent({
      node: {
        id: 'contact-form',
        type: 'Form',
      },
      dataBindings: {
        'contact-form': {
          componentId: 'contact-form',
          events: {
            submit: [
              {
                target: { kind: 'action', type: 'db.persist' },
                input: {
                  collection: { kind: 'literal', value: 'contact_messages' },
                  values: {
                    kind: 'array',
                    items: [
                      {
                        kind: 'object',
                        fields: {
                          field: { kind: 'literal', value: 'firstname' },
                          value: {
                            kind: 'source',
                            source: { kind: 'event', path: 'payload.values.firstname' },
                            transforms: ['trim'],
                          },
                        },
                      },
                      {
                        kind: 'object',
                        fields: {
                          field: { kind: 'literal', value: 'message' },
                          value: {
                            kind: 'source',
                            source: { kind: 'event', path: 'payload.values.message' },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            ],
          },
        },
      },
      eventName: 'submit',
      event: {
        type: 'form.submit',
        sourceNodeId: 'contact-form',
        payload: {
          values: {
            firstname: ' Fabio ',
            message: 'Hello',
          },
        },
      },
      actionHandlers: {
        'db.persist': createDbPersistActionHandler({
          dbAdapter,
          onResult: (result) => {
            results.push(result);
          },
        }),
      },
    });

    expect(calls).toEqual([
      {
        table: 'contact_messages',
        values: {
          firstname: 'Fabio',
          message: 'Hello',
        },
      },
    ]);
    expect(results.map((result) => result.ok)).toEqual([true]);
  });

  it('reports validation errors without calling the adapter', async () => {
    const calls: DbInsertInput[] = [];
    const dbAdapter = createFakeDbAdapter(calls);

    const result = await executeDbPersistAction({
      dbAdapter,
      handlerArgs: {
        action: {
          type: 'db.persist',
        },
        resolvedPayload: {
          collection: '',
          values: [{ field: 'message', value: 'Hello' }],
        },
      },
    });

    expect(calls).toEqual([]);
    expect(result).toEqual({
      ok: false,
      error: {
        code: 'missing_collection',
        message: 'db.persist requires a non-empty collection.',
      },
    });
  });
});
