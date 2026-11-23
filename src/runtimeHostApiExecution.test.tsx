import type {
  ApiDefinitionRegistry,
  AppManifest,
  ComponentDataBindingRegistry,
  ScreenSpec,
  UiNode,
} from '@ankhorage/contracts';
import { expect, it, mock } from 'bun:test';
import React from 'react';
import { act, create } from 'react-test-renderer';

import type { ComponentRegistry } from './registry';
import { createRuntimeApiCapabilityExecutor } from './runtimeApiCapabilities';
import { RuntimeRendererConfigProvider } from './RuntimeRendererConfig';

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

void mock.module('react-native', () => ({
  StyleSheet: { create: <TStyles,>(styles: TStyles): TStyles => styles },
  Text: 'text',
  View: 'view',
}));

const { RuntimeScreen } = await import('./RuntimeScreen');

const ButtonProbe = ({ taskId }: { readonly taskId?: unknown }): React.ReactElement => (
  <button data-task-id={String(taskId)}>Company</button>
);

const registry: ComponentRegistry = { ButtonProbe };
const root = { id: 'company', props: { taskId: 'pending' }, type: 'ButtonProbe' } satisfies UiNode;
const screen = {
  dataLoaders: [{ capability: 'api.zefix.company.search', result: 'companySearch' }],
  id: 'zefix',
  name: 'Zefix',
  root,
} satisfies ScreenSpec;
const dataBindings = {
  company: {
    componentId: 'company',
    props: {
      taskId: {
        value: {
          capability: 'result.companySearch',
          path: 'companies.0.id',
          result: 'companySearch',
        },
      },
    },
  },
} satisfies ComponentDataBindingRegistry;
const apis = {
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
const manifest = {
  activeThemeId: 'default',
  infra: {
    apis,
    environments: {
      local: { deployment: { compute: { provider: 'local' }, runtime: { provider: 'minikube' } } },
    },
    modules: {},
  },
  metadata: {
    category: 'developer_tools',
    name: 'Runtime host API fixture',
    slug: 'runtime-host-api-fixture',
    themeId: 'default',
    version: '1.0.0',
  },
  navigator: { routes: [], type: 'stack' },
  screens: {},
  settings: { localization: { defaultLocale: 'en', locales: ['en'] } },
  themes: {
    default: {
      dark: { harmony: 'analogous', primaryColor: '#6699ff' },
      id: 'default',
      light: { harmony: 'analogous', primaryColor: '#3366ff' },
      name: 'Default',
    },
  },
} satisfies AppManifest;

it('requires an injected host executor before a credentialed manifest API can populate client props or result slots', async () => {
  const diagnostics: unknown[] = [];
  let renderer: ReturnType<typeof create> | undefined;

  await act(async () => {
    renderer = create(
      <RuntimeRendererConfigProvider
        value={{ dataBindings, onDiagnostics: (reported) => diagnostics.push(...reported) }}
      >
        <RuntimeScreen manifest={manifest} registry={registry} screen={screen} />
      </RuntimeRendererConfigProvider>,
    );
    await Promise.resolve();
    await Promise.resolve();
  });
  if (renderer === undefined) throw new Error('Expected mounted RuntimeScreen.');

  expect(renderer.root.findByType('button').props['data-task-id']).toBe('undefined');
  expect(diagnostics).toEqual([
    {
      code: 'missing-adapter',
      message: "API capability 'api.zefix.company.search' requires an injected host executor.",
      severity: 'error',
    },
  ]);
});

it('allows a host executor to expose an API result without exposing its resolved credential', async () => {
  const secret = 'zefix-host-only-secret';
  const fetch = mock(() =>
    Promise.resolve({ status: 200, text: () => Promise.resolve('{"companies":[{"id":"CHE-1"}]}') }),
  );
  const executeCapability = createRuntimeApiCapabilityExecutor({
    apis,
    credentialResolver: () => ({ headers: { authorization: `Basic ${secret}` } }),
    fetch,
  });
  let renderer: ReturnType<typeof create> | undefined;

  await act(async () => {
    renderer = create(
      <RuntimeRendererConfigProvider value={{ dataBindings, executeCapability }}>
        <RuntimeScreen manifest={manifest} registry={registry} screen={screen} />
      </RuntimeRendererConfigProvider>,
    );
    await Promise.resolve();
    await Promise.resolve();
  });
  if (renderer === undefined) throw new Error('Expected mounted RuntimeScreen.');

  const { props } = renderer.root.findByType('button');
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(props['data-task-id']).toBe('CHE-1');
  expect(JSON.stringify(props)).not.toContain(secret);
});
