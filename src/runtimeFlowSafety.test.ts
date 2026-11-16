import type { FlowRunSnapshot } from '@ankhorage/contracts/flow';
import { expect, it } from 'bun:test';

import { composeRuntimeCapabilityExecutor } from './runtimeCapabilityExecutor.js';
import type { RuntimeFlowPort } from './types/runtimeFlow.js';

const RUN = {
  createdAt: '2026-11-16T10:00:00.000Z',
  flow: { id: 'daily-briefing', version: 3 },
  id: 'run-1',
  status: 'running',
  steps: [],
  trigger: { kind: 'manual', triggerId: 'manual' },
} satisfies FlowRunSnapshot;

/*** Provide an injected Flow port whose only mutable behavior is a test-owned start operation. */
const createFlowPort = (startAsync: RuntimeFlowPort['startAsync']): RuntimeFlowPort => ({
  startAsync,
  cancelAsync: () => Promise.resolve(undefined),
  eventsAsync: () => Promise.resolve([]),
  resolveApprovalAsync: () => Promise.resolve(undefined),
  statusAsync: () => Promise.resolve(undefined),
});

it('rejects non-serializable inline values without calling the Flow provider', async () => {
  const calls: string[] = [];
  const flowPort = createFlowPort(() => {
    calls.push('start');
    return Promise.resolve(RUN);
  });
  const execute = composeRuntimeCapabilityExecutor({
    apiCapabilityExecutor: () => Promise.resolve({ data: {}, ok: true as const }),
    flowPort,
  });
  const result = await execute({
    capability: 'flow.start',
    input: {
      flow: RUN.flow,
      idempotencyKey: 'invalid-value',
      input: { recipient: { kind: 'inline', value: Number.NaN } },
      triggerId: 'manual',
    },
  });
  expect(result).toEqual({
    diagnostics: [
      {
        code: 'invalid-input',
        message: "Capability 'flow.start' received an invalid Flow request.",
        severity: 'error',
      },
    ],
    ok: false,
  });
  expect(calls).toEqual([]);
});

it('rejects a provider response for another published workflow revision', async () => {
  const flowPort = createFlowPort(() =>
    Promise.resolve({ ...RUN, flow: { id: RUN.flow.id, version: 4 } }),
  );
  const execute = composeRuntimeCapabilityExecutor({
    apiCapabilityExecutor: () => Promise.resolve({ data: {}, ok: true as const }),
    flowPort,
  });
  const result = await execute({
    capability: 'flow.start',
    input: { flow: RUN.flow, idempotencyKey: 'revision-3', triggerId: 'manual' },
  });
  expect(result).toEqual({
    diagnostics: [
      {
        code: 'flow-revision-mismatch',
        message: 'The Flow provider returned a different published revision.',
        severity: 'error',
      },
    ],
    ok: false,
  });
});
