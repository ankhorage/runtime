import type {
  DataEndpointConfig,
  DataSourceConfig,
  DataSourceRegistry,
} from '@ankhorage/contracts';
import { describe, expect, it } from 'bun:test';

import { createRuntimeDataSourceOperationExecutor } from './runtimeDataSourceOperations';

function createDataSources(): DataSourceRegistry {
  return {
    chess: {
      id: 'chess',
      kind: 'rest',
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

function getFixtureDataSource(registry: DataSourceRegistry): DataSourceConfig {
  const dataSource = registry.chess;
  if (dataSource === undefined) {
    throw new Error('Expected chess data-source fixture to exist.');
  }

  return dataSource;
}

function getFixtureEndpoint(dataSource: DataSourceConfig): DataEndpointConfig {
  const endpoint = dataSource.endpoints.opening;
  if (endpoint === undefined) {
    throw new Error('Expected opening endpoint fixture to exist.');
  }

  return endpoint;
}

describe('createRuntimeDataSourceOperationExecutor', () => {
  it('executes REST data-source operations through the data-sources test runner', async () => {
    const dataSources = createDataSources();
    const dataSource = getFixtureDataSource(dataSources);
    const endpoint = getFixtureEndpoint(dataSource);
    const calls: string[] = [];
    const executor = createRuntimeDataSourceOperationExecutor({
      fetch: (url, init) => {
        calls.push(`${init.method} ${url}`);
        return Promise.resolve({
          status: 200,
          headers: { 'content-type': 'application/json' },
          text: () =>
            Promise.resolve(
              '{"moves":[{"san":"e4","uci":"e2e4","games":1200,"whiteWinRate":0.54}]}',
            ),
        });
      },
    });

    const result = await executor({
      dataSource,
      endpoint,
      input: {
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      },
      operation: {
        dataSourceId: 'chess',
        endpointId: 'opening',
        operationId: 'opening.moves',
      },
    });

    expect(calls).toEqual([
      'GET https://api.ankhorage.com/v1/chess/opening?fen=rnbqkbnr%2Fpppppppp%2F8%2F8%2F8%2F8%2FPPPPPPPP%2FRNBQKBNR%20w%20KQkq%20-%200%201',
    ]);
    expect(result).toEqual({
      ok: true,
      data: {
        moves: [
          {
            games: 1200,
            san: 'e4',
            uci: 'e2e4',
            whiteWinRate: 0.54,
          },
        ],
      },
      diagnostics: [],
    });
  });

  it('returns diagnostics when event input does not resolve to an object', async () => {
    const dataSources = createDataSources();
    const dataSource = getFixtureDataSource(dataSources);
    const endpoint = getFixtureEndpoint(dataSource);
    const executor = createRuntimeDataSourceOperationExecutor({
      fetch: () =>
        Promise.resolve({
          status: 200,
          text: () => Promise.resolve('{}'),
        }),
    });

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
