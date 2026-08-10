import type {
  DataEndpointConfig,
  DataSourceConfig,
  DataSourceRegistry,
  DbAdapter,
  DbDeleteInput,
  DbFindByIdInput,
  DbInsertInput,
  DbRecord,
  DbResult,
  DbSelectInput,
  DbUpdateInput,
} from '@ankhorage/contracts';
import { createGeneratedApiDataSource } from '@ankhorage/data-sources';
import { describe, expect, it } from 'bun:test';

import { createRuntimeDataSourceOperationExecutor } from './runtimeDataSourceOperations';

function createExternalDataSources(): DataSourceRegistry {
  return {
    chess: {
      id: 'chess',
      kind: 'api',
      origin: 'external',
      protocol: 'rest',
      baseUrl: 'https://api.ankhorage.com',
      endpoints: {
        opening: {
          id: 'opening',
          kind: 'http',
          operations: {
            'opening.moves': {
              id: 'opening.moves',
              endpointId: 'opening',
              protocol: 'http',
              intent: 'read',
              method: 'GET',
              path: '/v1/chess/opening',
              request: {
                parameters: [
                  {
                    name: 'fen',
                    location: 'query',
                    required: true,
                    schema: { type: 'string' },
                  },
                ],
              },
            },
          },
        },
      },
    },
  };
}

function createGeneratedDataSource(): DataSourceConfig {
  const result = createGeneratedApiDataSource({
    id: 'posts-api',
    protocol: 'rest',
    basePath: '/api',
    database: { id: 'primary-db', kind: 'database' },
    resources: [
      {
        id: 'posts',
        path: '/posts',
        operations: ['list', 'read', 'create', 'update', 'delete'],
        collection: {
          name: 'posts',
          schema: 'public',
          primaryKey: 'id',
          fields: [
            { name: 'id', type: 'uuid', required: true, unique: true },
            { name: 'title', type: 'text', required: true },
          ],
        },
      },
    ],
  });
  if (!result.ok) throw new Error('Expected generated API fixture to normalize.');
  return result.data;
}

function getFixtureDataSource(registry: DataSourceRegistry): DataSourceConfig {
  const dataSource = registry.chess;
  if (dataSource === undefined) throw new Error('Expected chess data-source fixture to exist.');
  return dataSource;
}

function getFixtureEndpoint(
  dataSource: DataSourceConfig,
  endpointId = 'opening',
): DataEndpointConfig {
  const endpoint = dataSource.endpoints[endpointId];
  if (endpoint === undefined)
    throw new Error(`Expected '${endpointId}' endpoint fixture to exist.`);
  return endpoint;
}

interface DatabaseCalls {
  readonly select: DbSelectInput[];
  readonly findById: DbFindByIdInput[];
  readonly insert: DbInsertInput<object>[];
  readonly update: DbUpdateInput<object>[];
  readonly delete: DbDeleteInput[];
}

function createDatabaseFixture(): { readonly adapter: DbAdapter; readonly calls: DatabaseCalls } {
  const calls: DatabaseCalls = { select: [], findById: [], insert: [], update: [], delete: [] };
  const adapter: DbAdapter = {
    capabilities: { transactions: false, returning: true, realtime: false },
    select<TRecord extends object = DbRecord>(input: DbSelectInput): Promise<DbResult<TRecord[]>> {
      calls.select.push(input);
      return Promise.resolve({ ok: true, data: [{ id: 'post-1', title: 'First' } as TRecord] });
    },
    findById<TRecord extends object = DbRecord>(
      input: DbFindByIdInput,
    ): Promise<DbResult<TRecord | null>> {
      calls.findById.push(input);
      return Promise.resolve({ ok: true, data: { id: input.id, title: 'First' } as TRecord });
    },
    insert<TRecord extends object = DbRecord>(
      input: DbInsertInput<TRecord>,
    ): Promise<DbResult<TRecord[]>> {
      calls.insert.push(input);
      return Promise.resolve({
        ok: true,
        data: [{ id: 'post-2', title: 'Created' } as TRecord],
      });
    },
    update<TRecord extends object = DbRecord>(
      input: DbUpdateInput<TRecord>,
    ): Promise<DbResult<TRecord[]>> {
      calls.update.push(input);
      return Promise.resolve({
        ok: true,
        data: [{ id: 'post-1', title: 'Updated' } as TRecord],
      });
    },
    delete<TRecord extends object = DbRecord>(input: DbDeleteInput): Promise<DbResult<TRecord[]>> {
      calls.delete.push(input);
      return Promise.resolve({ ok: true, data: [{ id: 'post-1', title: 'First' } as TRecord] });
    },
  };
  return { adapter, calls };
}

function createGeneratedExecutor(adapter?: DbAdapter) {
  return createRuntimeDataSourceOperationExecutor({
    databaseAdapters: adapter === undefined ? undefined : { 'primary-db': adapter },
  });
}

async function executeGeneratedOperation(
  operationId: string,
  input?: Readonly<Record<string, string | number>>,
  adapter?: DbAdapter,
) {
  const dataSource = createGeneratedDataSource();
  return createGeneratedExecutor(adapter)({
    dataSource,
    endpoint: getFixtureEndpoint(dataSource, 'posts'),
    input,
    operation: { dataSourceId: 'posts-api', endpointId: 'posts', operationId },
  });
}

describe('createRuntimeDataSourceOperationExecutor', () => {
  it('executes external REST operations through the data-sources test runner', async () => {
    const dataSource = getFixtureDataSource(createExternalDataSources());
    const endpoint = getFixtureEndpoint(dataSource);
    const calls: string[] = [];
    const executor = createRuntimeDataSourceOperationExecutor({
      fetch: (url, init) => {
        calls.push(`${init.method} ${url}`);
        return Promise.resolve({
          status: 200,
          headers: { 'content-type': 'application/json' },
          text: () => Promise.resolve('{"moves":[{"san":"e4"}]}'),
        });
      },
    });

    const result = await executor({
      dataSource,
      endpoint,
      input: { fen: 'start' },
      operation: {
        dataSourceId: 'chess',
        endpointId: 'opening',
        operationId: 'opening.moves',
      },
    });

    expect(calls).toEqual(['GET https://api.ankhorage.com/v1/chess/opening?fen=start']);
    expect(result).toEqual({ ok: true, data: { moves: [{ san: 'e4' }] }, diagnostics: [] });
  });

  it('routes generated list/read operations through the referenced database adapter', async () => {
    const { adapter, calls } = createDatabaseFixture();

    expect(
      await executeGeneratedOperation('posts.list', { limit: 10, offset: 2 }, adapter),
    ).toEqual({
      ok: true,
      data: [{ id: 'post-1', title: 'First' }],
      diagnostics: [],
    });
    expect(await executeGeneratedOperation('posts.read', { id: 'post-1' }, adapter)).toEqual({
      ok: true,
      data: { id: 'post-1', title: 'First' },
      diagnostics: [],
    });

    expect(calls.select).toEqual([
      { table: 'posts', schema: 'public', page: { limit: 10, offset: 2 } },
    ]);
    expect(calls.findById).toEqual([
      { table: 'posts', schema: 'public', id: 'post-1', idField: 'id' },
    ]);
  });

  it('routes generated create/update/delete operations with canonical result shapes', async () => {
    const { adapter, calls } = createDatabaseFixture();

    expect(await executeGeneratedOperation('posts.create', { title: 'Created' }, adapter)).toEqual({
      ok: true,
      data: { id: 'post-2', title: 'Created' },
      diagnostics: [],
    });
    expect(
      await executeGeneratedOperation('posts.update', { id: 'post-1', title: 'Updated' }, adapter),
    ).toEqual({
      ok: true,
      data: { id: 'post-1', title: 'Updated' },
      diagnostics: [],
    });
    expect(await executeGeneratedOperation('posts.delete', { id: 'post-1' }, adapter)).toEqual({
      ok: true,
      data: { deleted: true },
      diagnostics: [],
    });

    expect(calls.insert).toEqual([
      { table: 'posts', schema: 'public', values: { title: 'Created' } },
    ]);
    expect(calls.update).toEqual([
      {
        table: 'posts',
        schema: 'public',
        values: { title: 'Updated' },
        filters: [{ field: 'id', operator: 'eq', value: 'post-1' }],
      },
    ]);
    expect(calls.delete).toEqual([
      {
        table: 'posts',
        schema: 'public',
        filters: [{ field: 'id', operator: 'eq', value: 'post-1' }],
      },
    ]);
  });

  it('returns a missing-adapter diagnostic instead of falling through to HTTP', async () => {
    const result = await executeGeneratedOperation('posts.list');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.diagnostics[0]).toMatchObject({
        code: 'missing-adapter',
        dataSourceId: 'posts-api',
        endpointId: 'posts',
        operationId: 'posts.list',
      });
    }
  });

  it('returns diagnostics when operation input does not resolve to an object', async () => {
    const dataSource = getFixtureDataSource(createExternalDataSources());
    const endpoint = getFixtureEndpoint(dataSource);
    const executor = createRuntimeDataSourceOperationExecutor({});

    const result = await executor({
      dataSource,
      endpoint,
      input: 'not-an-object',
      operation: {
        dataSourceId: 'chess',
        endpointId: 'opening',
        operationId: 'opening.moves',
      },
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.diagnostics).toEqual([
        {
          code: 'invalid-config',
          dataSourceId: 'chess',
          endpointId: 'opening',
          operationId: 'opening.moves',
          message: 'Operation input must resolve to an object.',
          severity: 'error',
        },
      ]);
    }
  });
});
