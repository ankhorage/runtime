import type { ComponentDataBindingRegistry } from '@ankhorage/contracts';
import type { FlowApprovalRequest, FlowRunSnapshot } from '@ankhorage/contracts/flow';
import type { FlowRunEvent } from '@ankhorage/flow';
import { expect, it, mock } from 'bun:test';

import { dispatchRuntimeComponentEvent } from './runtimeActionRegistry.js';
import { composeRuntimeCapabilityExecutor } from './runtimeCapabilityExecutor.js';
import {
  createRuntimeEventOperationLifecycle,
  type RuntimeEventOperationState,
} from './runtimeEventOperationLifecycle.js';
import type { RuntimeFlowPort } from './types/runtimeFlow.js';

const RUN = {
  createdAt: '2026-11-16T10:00:00.000Z',
  flow: { id: 'daily-briefing', version: 3 },
  id: 'run-1',
  status: 'running',
  steps: [],
  trigger: { kind: 'manual', triggerId: 'manual' },
} satisfies FlowRunSnapshot;

const CANCELLED_RUN = { ...RUN, status: 'cancelled' } satisfies FlowRunSnapshot;

const APPROVAL = {
  id: 'approval-1',
  requestedAt: '2026-11-16T10:01:00.000Z',
  runId: RUN.id,
  status: 'approved',
} satisfies FlowApprovalRequest;

const EVENT = {
  id: 4,
  runId: RUN.id,
  timestamp: '2026-11-16T10:02:00.000Z',
  type: 'run_progressed',
} satisfies FlowRunEvent;

const CANCEL_BINDINGS = {
  cancel: {
    componentId: 'cancel',
    events: {
      press: [
        {
          target: {
            capability: 'flow.cancel',
            input: { runId: { kind: 'literal', value: RUN.id } },
          },
        },
      ],
    },
  },
} satisfies ComponentDataBindingRegistry;

const createFlowPort = (): RuntimeFlowPort => ({
  cancelAsync: mock(() => Promise.resolve(CANCELLED_RUN)),
  eventsAsync: mock(() => Promise.resolve([EVENT])),
  resolveApprovalAsync: mock(() => Promise.resolve(APPROVAL)),
  startAsync: mock(() => Promise.resolve(RUN)),
  statusAsync: mock(() => Promise.resolve(RUN)),
});

it('routes all released Flow operations through one injected Runtime port', async () => {
  const flowPort = createFlowPort();
  const executeCapability = composeRuntimeCapabilityExecutor({
    apiCapabilityExecutor: () => Promise.resolve({ data: {}, ok: true as const }),
    flowPort,
  });

  const [start, status, cancel, approval, events] = await Promise.all([
    executeCapability({
      capability: 'flow.start',
      input: {
        flow: RUN.flow,
        idempotencyKey: 'briefing-2026-11-16',
        input: { recipient: { kind: 'inline', value: 'artiphishle' } },
        triggerId: 'manual',
      },
    }),
    executeCapability({ capability: 'flow.status', input: { runId: RUN.id } }),
    executeCapability({ capability: 'flow.cancel', input: { runId: RUN.id } }),
    executeCapability({
      capability: 'flow.approval',
      input: { approvalId: APPROVAL.id, approved: true },
    }),
    executeCapability({ capability: 'flow.events', input: { afterId: 3, runId: RUN.id } }),
  ]);
  expect([start, status, cancel, approval, events]).toEqual([
    { data: RUN, ok: true },
    { data: RUN, ok: true },
    { data: CANCELLED_RUN, ok: true },
    { data: APPROVAL, ok: true },
    { data: [EVENT], ok: true },
  ]);

  expect(flowPort.startAsync).toHaveBeenCalledWith({
    flow: RUN.flow,
    idempotencyKey: 'briefing-2026-11-16',
    input: { recipient: { kind: 'inline', value: 'artiphishle' } },
    triggerId: 'manual',
  });
  expect(flowPort.statusAsync).toHaveBeenCalledWith(RUN.id);
  expect(flowPort.cancelAsync).toHaveBeenCalledWith(RUN.id);
  expect(flowPort.resolveApprovalAsync).toHaveBeenCalledWith({
    approvalId: APPROVAL.id,
    approved: true,
  });
  expect(flowPort.eventsAsync).toHaveBeenCalledWith({ afterId: 3, runId: RUN.id });
});

it('rejects invalid Flow actions locally and reports an unconfigured port explicitly', async () => {
  const flowPort = createFlowPort();
  const configuredExecutor = composeRuntimeCapabilityExecutor({
    apiCapabilityExecutor: () => Promise.resolve({ data: {}, ok: true as const }),
    flowPort,
  });

  const [invalidStart, invalidEvents] = await Promise.all([
    configuredExecutor({ capability: 'flow.start', input: { flow: { id: 'daily', version: 0 } } }),
    configuredExecutor({ capability: 'flow.events', input: { afterId: -1 } }),
  ]);
  expect(invalidStart).toEqual({
    diagnostics: [
      {
        code: 'invalid-input',
        message: "Capability 'flow.start' received an invalid Flow request.",
        severity: 'error',
      },
    ],
    ok: false,
  });
  expect(invalidEvents).toEqual({
    diagnostics: [
      {
        code: 'invalid-input',
        message: "Capability 'flow.events' received an invalid Flow request.",
        severity: 'error',
      },
    ],
    ok: false,
  });
  expect(flowPort.startAsync).not.toHaveBeenCalled();
  expect(flowPort.eventsAsync).not.toHaveBeenCalled();

  const unconfiguredExecutor = composeRuntimeCapabilityExecutor({
    apiCapabilityExecutor: () => Promise.resolve({ data: {}, ok: true as const }),
  });
  const missingPort = await unconfiguredExecutor({
    capability: 'flow.status',
    input: { runId: RUN.id },
  });
  expect(missingPort).toEqual({
    diagnostics: [
      {
        code: 'missing-adapter',
        message: "Capability 'flow.status' requires a configured RuntimeFlowPort.",
        severity: 'error',
      },
    ],
    ok: false,
  });
});

it('exposes missing resources and provider failures as binding diagnostics', async () => {
  const missingFlowPort: RuntimeFlowPort = {
    ...createFlowPort(),
    statusAsync: () => Promise.resolve(undefined),
  };
  const missingExecutor = composeRuntimeCapabilityExecutor({
    apiCapabilityExecutor: () => Promise.resolve({ data: {}, ok: true as const }),
    flowPort: missingFlowPort,
  });
  const missingRun = await missingExecutor({ capability: 'flow.status', input: { runId: RUN.id } });
  expect(missingRun).toEqual({
    diagnostics: [
      { code: 'flow-resource-not-found', message: 'Flow run was not found.', severity: 'error' },
    ],
    ok: false,
  });

  const deniedFlowPort: RuntimeFlowPort = {
    ...createFlowPort(),
    startAsync: () =>
      Promise.reject(
        Object.assign(new Error('Approval is required.'), { code: 'permission-denied' }),
      ),
  };
  const deniedExecutor = composeRuntimeCapabilityExecutor({
    apiCapabilityExecutor: () => Promise.resolve({ data: {}, ok: true as const }),
    flowPort: deniedFlowPort,
  });
  const deniedStart = await deniedExecutor({
    capability: 'flow.start',
    input: { flow: RUN.flow, idempotencyKey: 'retry-safe-key', triggerId: 'manual' },
  });
  expect(deniedStart).toEqual({
    diagnostics: [
      { code: 'permission-denied', message: 'Approval is required.', severity: 'error' },
    ],
    ok: false,
  });
});

it('drives the existing event error state when a Flow request times out', async () => {
  const states: RuntimeEventOperationState[] = [];
  const lifecycle = createRuntimeEventOperationLifecycle((state) => states.push(state));
  const flowPort: RuntimeFlowPort = {
    ...createFlowPort(),
    cancelAsync: () =>
      Promise.reject(Object.assign(new Error('The Flow server timed out.'), { code: 'timeout' })),
  };
  const executeCapability = composeRuntimeCapabilityExecutor({
    apiCapabilityExecutor: () => Promise.resolve({ data: {}, ok: true as const }),
    flowPort,
  });

  const diagnostics = await dispatchRuntimeComponentEvent({
    dataBindings: CANCEL_BINDINGS,
    event: { payload: {}, sourceNodeId: 'cancel', type: 'button.press' },
    eventOperationLifecycle: lifecycle,
    executeCapability,
    node: { id: 'cancel', type: 'Button' },
  });

  expect(diagnostics).toEqual([
    { code: 'timeout', message: 'The Flow server timed out.', severity: 'error' },
  ]);
  expect(states).toEqual([
    {
      capability: 'flow.cancel',
      errorMessage: '',
      loading: true,
      nodeId: 'cancel',
      status: 'loading',
    },
    {
      capability: 'flow.cancel',
      errorMessage: 'The Flow server timed out.',
      loading: false,
      nodeId: 'cancel',
      status: 'error',
    },
  ]);
});
