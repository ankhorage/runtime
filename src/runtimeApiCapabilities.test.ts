import type { ApiDefinitionRegistry } from '@ankhorage/contracts';
import { expect, it, mock } from 'bun:test';

import { createRuntimeApiCapabilityExecutor } from './runtimeApiCapabilities';

const ZEFIX_APIS = {
  zefix: {
    baseUrl: 'https://www.zefix.admin.ch',
    credential: { id: 'zefix-basic', kind: 'basic' },
    endpoints: {
      company: {
        id: 'company',
        kind: 'http',
        operations: {
          'company.search': {
            id: 'company.search',
            intent: 'read',
            method: 'GET',
            path: '/api/company/search',
            protocol: 'http',
          },
        },
      },
    },
    id: 'zefix',
    origin: 'external',
    protocol: 'rest',
  },
} satisfies ApiDefinitionRegistry;

it('refuses a credentialed Zefix operation without resolving credentials or issuing a request', async () => {
  const fetch = mock(() =>
    Promise.resolve({ status: 200, text: () => Promise.resolve('{"companies":[]}') }),
  );
  const execute = createRuntimeApiCapabilityExecutor({ apis: ZEFIX_APIS, fetch });

  const result = await execute({ capability: 'api.zefix.company.search' });

  expect(fetch).not.toHaveBeenCalled();
  expect(result).toEqual({
    diagnostics: [
      {
        apiId: 'zefix',
        code: 'missing-credential',
        endpointId: 'company',
        message: "Credential 'zefix-basic' requires a resolver.",
        operationId: 'company.search',
        severity: 'error',
      },
    ],
    ok: false,
  });
});

it('executes a credentialed Zefix operation through a trusted host resolver without returning its secret', async () => {
  const secret = 'zefix-host-only-secret';
  const fetch = mock(() =>
    Promise.resolve({ status: 200, text: () => Promise.resolve('{"companies":[{"id":"CHE-1"}]}') }),
  );
  const execute = createRuntimeApiCapabilityExecutor({
    apis: ZEFIX_APIS,
    credentialResolver: () => ({ headers: { authorization: `Basic ${secret}` } }),
    fetch,
  });

  const result = await execute({ capability: 'api.zefix.company.search' });

  expect(fetch).toHaveBeenCalledWith('https://www.zefix.admin.ch/api/company/search', {
    headers: { authorization: `Basic ${secret}` },
    method: 'GET',
  });
  expect(result).toEqual({ data: { companies: [{ id: 'CHE-1' }] }, diagnostics: [], ok: true });
  expect(JSON.stringify(result)).not.toContain(secret);
});

it('executes an API without a credential reference without requiring a resolver', async () => {
  const fetch = mock(() =>
    Promise.resolve({ status: 200, text: () => Promise.resolve('{"ok":true}') }),
  );
  const execute = createRuntimeApiCapabilityExecutor({
    apis: {
      zefix: { ...ZEFIX_APIS.zefix, credential: undefined },
    },
    fetch,
  });

  const result = await execute({ capability: 'api.zefix.company.search' });

  expect(fetch).toHaveBeenCalledTimes(1);
  expect(result).toEqual({ data: { ok: true }, diagnostics: [], ok: true });
});

it('redacts credential-bearing transport and resolver failures', async () => {
  const secret = 'zefix-host-only-secret';
  const fetch = mock(() => Promise.reject(new Error(`Authorization: Basic ${secret}`)));
  const execute = createRuntimeApiCapabilityExecutor({
    apis: ZEFIX_APIS,
    credentialResolver: () => ({ headers: { authorization: `Basic ${secret}` } }),
    fetch,
  });
  const failingResolver = createRuntimeApiCapabilityExecutor({
    apis: ZEFIX_APIS,
    credentialResolver: () => Promise.reject(new Error(`vault returned ${secret}`)),
    fetch,
  });

  const [transportFailure, resolverFailure] = await Promise.all([
    execute({ capability: 'api.zefix.company.search' }),
    failingResolver({ capability: 'api.zefix.company.search' }),
  ]);

  expect(transportFailure).toEqual({
    diagnostics: [
      {
        apiId: 'zefix',
        code: 'network-error',
        endpointId: 'company',
        message: 'The API operation could not be completed. Please try again.',
        operationId: 'company.search',
        severity: 'error',
      },
    ],
    ok: false,
  });
  expect(resolverFailure).toEqual({
    diagnostics: [
      {
        code: 'adapter-error',
        message: 'The API operation could not be completed. Please try again.',
        severity: 'error',
      },
    ],
    ok: false,
  });
  expect(JSON.stringify({ resolverFailure, transportFailure })).not.toContain(secret);
});
