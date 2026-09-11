import type {
  ApiDefinitionList,
  BindingOperationRef,
  ComponentDataBindingRegistry,
  UiNode,
} from '@ankhorage/contracts';
import { describe, expect, it } from 'bun:test';

import { dispatchRuntimeComponentEvent } from './runtimeActionRegistry';
import {
  createRuntimeEventOperationBindingContext,
  createRuntimeEventOperationLifecycle,
  IDLE_RUNTIME_EVENT_OPERATION_STATE,
  type RuntimeEventOperationState,
} from './runtimeEventOperationLifecycle';

const operation: BindingOperationRef = {
  apiId: 'poker',
  endpointId: 'tasks',
  operationId: 'tasks.answer',
};
const node: UiNode = { id: 'answer-button', type: 'Button' };
const apis: ApiDefinitionList = [
  {
    id: 'poker',
    origin: 'external',
    protocol: 'rest',
    baseUrl: 'https://api.example.com/v1/poker',
    endpoints: {
      tasks: {
        id: 'tasks',
        kind: 'http',
        operations: {
          'tasks.answer': {
            id: 'tasks.answer',
            endpointId: 'tasks',
            protocol: 'http',
            intent: 'update',
            method: 'POST',
            path: '/training/tasks/{taskId}/answer',
          },
        },
      },
    },
  },
];
const dataBindings: ComponentDataBindingRegistry = {
  'answer-button': {
    componentId: 'answer-button',
    events: { press: [{ target: { kind: 'operation', operation } }] },
  },
};

function eventArgs() {
  return {
    node,
    eventName: 'press',
    event: { type: 'button.press', sourceNodeId: node.id, payload: {} },
  } as const;
}

describe('runtime event operation lifecycle', () => {
  it('exposes a bindable idle namespace without replacing caller Runtime context', () => {
    expect(
      createRuntimeEventOperationBindingContext(
        { runtime: { locale: 'en' }, task: { id: 'task-1' } },
        IDLE_RUNTIME_EVENT_OPERATION_STATE,
      ),
    ).toEqual({
      runtime: {
        locale: 'en',
        eventOperation: { status: 'idle', loading: false, errorMessage: '' },
      },
      task: { id: 'task-1' },
    });
  });
});

describe('runtime event operation lifecycle concurrency', () => {
  it('publishes loading and success while rejecting a concurrent duplicate press', async () => {
    const states: RuntimeEventOperationState[] = [];
    const lifecycle = createRuntimeEventOperationLifecycle((state) => states.push(state));
    let resolveExecution: (() => void) | undefined;
    let calls = 0;
    const executeOperation = () => {
      calls += 1;
      return new Promise<{ ok: true; data: { accepted: boolean } }>((resolve) => {
        resolveExecution = () => resolve({ ok: true, data: { accepted: true } });
      });
    };

    const first = dispatchRuntimeComponentEvent({
      ...eventArgs(),
      apis,
      dataBindings,
      eventOperationLifecycle: lifecycle,
      executeOperation,
    });
    const duplicate = dispatchRuntimeComponentEvent({
      ...eventArgs(),
      apis,
      dataBindings,
      eventOperationLifecycle: lifecycle,
      executeOperation,
    });

    while (resolveExecution === undefined) {
      await Promise.resolve();
    }
    expect(calls).toBe(1);
    expect(states.at(-1)).toMatchObject({ status: 'loading', loading: true });
    resolveExecution();
    await Promise.all([first, duplicate]);

    expect(states.at(-1)).toMatchObject({
      status: 'success',
      loading: false,
      errorMessage: '',
    });
  });
});

describe('runtime event operation lifecycle retry', () => {
  it('publishes a human-readable failure and permits a fresh retry', async () => {
    const states: RuntimeEventOperationState[] = [];
    const lifecycle = createRuntimeEventOperationLifecycle((state) => states.push(state));
    let calls = 0;
    const executeOperation = () => {
      calls += 1;
      return Promise.resolve(
        calls === 1
          ? {
              ok: false as const,
              diagnostics: [
                {
                  code: 'network-error',
                  message: 'Could not submit answer.',
                  severity: 'error' as const,
                },
              ],
            }
          : { ok: true as const, data: { accepted: true } },
      );
    };

    await dispatchRuntimeComponentEvent({
      ...eventArgs(),
      apis,
      dataBindings,
      eventOperationLifecycle: lifecycle,
      executeOperation,
    });
    expect(states.at(-1)).toMatchObject({
      status: 'error',
      loading: false,
      errorMessage: 'Could not submit answer.',
    });

    await dispatchRuntimeComponentEvent({
      ...eventArgs(),
      apis,
      dataBindings,
      eventOperationLifecycle: lifecycle,
      executeOperation,
    });
    expect(calls).toBe(2);
    expect(states.at(-1)?.status).toBe('success');
  });
});
