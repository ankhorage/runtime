import type {
  ApiDefinitionRegistry,
  AppManifest,
  ComponentDataBindingRegistry,
  ScreenSpec,
  UiNode,
} from '@ankhorage/contracts';
import type { FlowRunSnapshot } from '@ankhorage/contracts/flow';
import { expect, it, mock } from 'bun:test';
import React from 'react';
import { act, create } from 'react-test-renderer';

import type { ComponentRegistry } from './registry';
import { createRuntimeApiCapabilityExecutor } from './runtimeApiCapabilities';
import type { RuntimeCapabilityExecutionArgs, RuntimeCapabilityExecutor } from './runtimeBindings';
import { RuntimeRendererConfigProvider } from './RuntimeRendererConfig';
import type { RuntimeFlowPort } from './types/runtimeFlow';

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

void mock.module('react-native', () => ({
  StyleSheet: { create: <TStyles,>(styles: TStyles): TStyles => styles },
  Text: 'text',
  View: 'view',
}));

const { RuntimeScreen } = await import('./RuntimeScreen');

let levelPress: (() => void) | undefined;

const ButtonProbe = ({
  onPress,
  taskId,
}: {
  readonly onPress?: () => void;
  readonly taskId?: unknown;
}): React.ReactElement => {
  levelPress = onPress;
  return (
    <button data-task-id={String(taskId)} onClick={onPress}>
      Level 1
    </button>
  );
};

const registry: ComponentRegistry = { ButtonProbe };

const root = { id: 'level-1', props: { taskId: 'pending' }, type: 'ButtonProbe' } satisfies UiNode;

const apis = {
  tasks: {
    baseUrl: 'https://tasks.example.com',
    endpoints: {
      tasks: {
        id: 'tasks',
        kind: 'http',
        operations: {
          list: {
            id: 'list',
            intent: 'read',
            method: 'GET',
            path: '/training/tasks',
            protocol: 'http',
          },
        },
      },
    },
    id: 'tasks',
    origin: 'external',
    protocol: 'rest',
  },
} satisfies ApiDefinitionRegistry;

const manifest = {
  activeThemeId: 'default',
  infra: {
    apis,
    environments: {
      local: {
        deployment: { compute: { provider: 'local' }, runtime: { provider: 'minikube' } },
      },
    },
    modules: {},
  },
  metadata: {
    category: 'developer_tools',
    name: 'Runtime Screen fixture',
    slug: 'runtime-screen-fixture',
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

const screen = {
  dataLoaders: [{ capability: 'api.tasks.list', result: 'listedTask' }],
  id: 'difficulty',
  name: 'Difficulty',
  root,
} satisfies ScreenSpec;

const dataBindings = {
  'level-1': {
    componentId: 'level-1',
    events: {
      press: [
        {
          target: {
            capability: 'navigator.navigate',
            input: {
              taskId: { capability: 'result.listedTask', path: 'tasks.0.id', result: 'listedTask' },
            },
          },
          when: {
            operator: 'exists',
            source: { capability: 'result.listedTask', path: 'tasks.0.id', result: 'listedTask' },
          },
        },
      ],
    },
    props: {
      taskId: {
        value: { capability: 'result.listedTask', path: 'tasks.0.id', result: 'listedTask' },
      },
    },
  },
} satisfies ComponentDataBindingRegistry;

const FLOW_RUN = {
  createdAt: '2026-11-16T10:00:00.000Z',
  flow: { id: 'daily-briefing', version: 3 },
  id: 'run-1',
  status: 'running',
  steps: [],
  trigger: { kind: 'manual', triggerId: 'manual' },
} satisfies FlowRunSnapshot;

const FLOW_BINDINGS = {
  'level-1': {
    componentId: 'level-1',
    events: {
      press: [
        {
          target: {
            capability: 'flow.start',
            input: {
              flow: { kind: 'literal', value: FLOW_RUN.flow },
              idempotencyKey: { kind: 'literal', value: 'daily-briefing-2026-11-16' },
              triggerId: { kind: 'literal', value: 'manual' },
            },
          },
        },
      ],
    },
  },
} satisfies ComponentDataBindingRegistry;

it('uses the injected API fetch, stores the task result, then allows conditional navigation', async () => {
  const fetch = mock(() =>
    Promise.resolve({ status: 200, text: () => Promise.resolve('{"tasks":[{"id":"task-1"}]}') }),
  );
  const executeApi = createRuntimeApiCapabilityExecutor({ apis, fetch });
  const navigate = mock((_args: RuntimeCapabilityExecutionArgs) =>
    Promise.resolve({ data: { pathname: '/decision-table' }, ok: true as const }),
  );
  const executeCapability: RuntimeCapabilityExecutor = (args) =>
    args.capability.startsWith('api.') ? executeApi(args) : navigate(args);
  let renderer: ReturnType<typeof create> | undefined;

  await act(async () => {
    renderer = create(
      <RuntimeRendererConfigProvider value={{ dataBindings, executeCapability }}>
        <RuntimeScreen manifest={manifest} registry={registry} screen={screen} />
      </RuntimeRendererConfigProvider>,
    );
    await Promise.resolve();
  });
  if (renderer === undefined) throw new Error('Expected mounted RuntimeScreen.');
  const mounted = renderer;

  expect(fetch).toHaveBeenCalledWith('https://tasks.example.com/training/tasks', {
    headers: {},
    method: 'GET',
  });
  expect(mounted.root.findByType('button').props['data-task-id']).toBe('task-1');
  if (levelPress === undefined) throw new Error('Expected a Level 1 press handler.');
  const pressLevel = levelPress;

  await act(async () => {
    pressLevel();
    await Promise.resolve();
    await Promise.resolve();
  });

  expect(navigate).toHaveBeenCalledWith({
    capability: 'navigator.navigate',
    event: { payload: {}, sourceNodeId: 'level-1', type: 'press' },
    input: { taskId: 'task-1' },
    node: root,
  });
});

it('passes generated Flow events through the configured remote Flow port', async () => {
  const startAsync = mock(() => Promise.resolve(FLOW_RUN));
  const flowPort: RuntimeFlowPort = {
    cancelAsync: () => Promise.resolve(undefined),
    eventsAsync: () => Promise.resolve([]),
    resolveApprovalAsync: () => Promise.resolve(undefined),
    startAsync,
    statusAsync: () => Promise.resolve(undefined),
  };
  let renderer: ReturnType<typeof create> | undefined;

  await act(async () => {
    renderer = create(
      <RuntimeRendererConfigProvider value={{ flowPort }}>
        <RuntimeScreen
          manifest={{ ...manifest, dataBindings: FLOW_BINDINGS }}
          registry={registry}
          screen={{ id: 'flow', name: 'Flow', root }}
        />
      </RuntimeRendererConfigProvider>,
    );
    await Promise.resolve();
  });
  if (renderer === undefined || levelPress === undefined)
    throw new Error('Expected a mounted Flow action.');

  await act(async () => {
    levelPress?.();
    await Promise.resolve();
  });

  expect(startAsync).toHaveBeenCalledWith({
    flow: { id: 'daily-briefing', version: 3 },
    idempotencyKey: 'daily-briefing-2026-11-16',
    triggerId: 'manual',
  });
});
