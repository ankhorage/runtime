import { type DataSourceDiagnostic, isSerializableValue } from '@ankhorage/contracts';
import type {
  FlowApprovalRequest,
  FlowDefinitionRef,
  FlowRunSnapshot,
} from '@ankhorage/contracts/flow';
import type { FlowRunEvent } from '@ankhorage/flow';
import { isRecord } from '@ankhorage/utility/object';

import type {
  RuntimeCapabilityExecutionArgs,
  RuntimeCapabilityExecutionResult,
} from './runtimeBindings.js';
import type { RuntimeFlowPort, RuntimeFlowStartRequest } from './types/runtimeFlow.js';

/** Executes supported Flow actions through the host-owned remote Flow port. */
export async function runtimeFlowCapabilities(
  args: RuntimeCapabilityExecutionArgs,
  flowPort: RuntimeFlowPort | undefined,
): Promise<RuntimeCapabilityExecutionResult> {
  if (flowPort === undefined) return missingFlowPortResult(args.capability);

  try {
    if (args.capability === 'flow.start') return await startFlowAsync(args.input, flowPort);
    if (args.capability === 'flow.status') return await readFlowStatusAsync(args.input, flowPort);
    if (args.capability === 'flow.cancel') return await cancelFlowAsync(args.input, flowPort);
    if (args.capability === 'flow.approval')
      return await resolveFlowApprovalAsync(args.input, flowPort);
    if (args.capability === 'flow.events') return await readFlowEventsAsync(args.input, flowPort);
    return unsupportedFlowCapabilityResult(args.capability);
  } catch (error) {
    return flowRequestErrorResult(error);
  }
}

/** Starts one published Flow revision after validating its portable binding input. */
async function startFlowAsync(
  input: RuntimeCapabilityExecutionArgs['input'],
  flowPort: RuntimeFlowPort,
): Promise<RuntimeCapabilityExecutionResult> {
  const request = resolveFlowStartRequest(input);
  if (request === undefined) return invalidFlowInputResult('flow.start');
  return successfulFlowResult(await flowPort.startAsync(request));
}

/** Reads the current snapshot for a previously started Flow run. */
async function readFlowStatusAsync(
  input: RuntimeCapabilityExecutionArgs['input'],
  flowPort: RuntimeFlowPort,
): Promise<RuntimeCapabilityExecutionResult> {
  const runId = resolveRunId(input);
  if (runId === undefined) return invalidFlowInputResult('flow.status');
  return foundFlowResult(await flowPort.statusAsync(runId), 'Flow run');
}

/** Requests cancellation through the remote owner rather than executing a local Flow engine. */
async function cancelFlowAsync(
  input: RuntimeCapabilityExecutionArgs['input'],
  flowPort: RuntimeFlowPort,
): Promise<RuntimeCapabilityExecutionResult> {
  const runId = resolveRunId(input);
  if (runId === undefined) return invalidFlowInputResult('flow.cancel');
  return foundFlowResult(await flowPort.cancelAsync(runId), 'Flow run');
}

/** Resolves one pending human approval through the authenticated remote Flow adapter. */
async function resolveFlowApprovalAsync(
  input: RuntimeCapabilityExecutionArgs['input'],
  flowPort: RuntimeFlowPort,
): Promise<RuntimeCapabilityExecutionResult> {
  const request = resolveApprovalRequest(input);
  if (request === undefined) return invalidFlowInputResult('flow.approval');
  return foundFlowResult(await flowPort.resolveApprovalAsync(request), 'Flow approval');
}

/** Reads resumable, redaction-safe Flow events after the supplied cursor. */
async function readFlowEventsAsync(
  input: RuntimeCapabilityExecutionArgs['input'],
  flowPort: RuntimeFlowPort,
): Promise<RuntimeCapabilityExecutionResult> {
  const request = resolveEventsRequest(input);
  if (request === undefined) return invalidFlowInputResult('flow.events');
  return successfulFlowResult(await flowPort.eventsAsync(request));
}

/** Narrows authored flow-start bindings to the released Flow trigger request shape. */
function resolveFlowStartRequest(
  input: RuntimeCapabilityExecutionArgs['input'],
): RuntimeFlowStartRequest | undefined {
  if (!isRecord(input)) return undefined;
  const { flow, idempotencyKey, input: flowInput, triggerId } = input;
  if (
    !isFlowDefinitionRef(flow) ||
    !isNonEmptyString(idempotencyKey) ||
    !isNonEmptyString(triggerId) ||
    (flowInput !== undefined && !isFlowInput(flowInput))
  )
    return undefined;
  return {
    flow,
    idempotencyKey,
    ...(flowInput === undefined ? {} : { input: flowInput }),
    triggerId,
  };
}

/** Narrows status and cancellation actions to one stable Flow run identity. */
function resolveRunId(input: RuntimeCapabilityExecutionArgs['input']): string | undefined {
  return isRecord(input) && isNonEmptyString(input.runId) ? input.runId : undefined;
}

/** Narrows a portable approval decision without accepting server-owned actor identity. */
function resolveApprovalRequest(
  input: RuntimeCapabilityExecutionArgs['input'],
): { readonly approvalId: string; readonly approved: boolean } | undefined {
  if (
    !isRecord(input) ||
    !isNonEmptyString(input.approvalId) ||
    typeof input.approved !== 'boolean'
  )
    return undefined;
  return { approvalId: input.approvalId, approved: input.approved };
}

/** Narrows a resumable event cursor and optional run filter. */
function resolveEventsRequest(
  input: RuntimeCapabilityExecutionArgs['input'],
): { readonly afterId: number; readonly runId?: string } | undefined {
  if (!isRecord(input) || !isEventCursor(input.afterId)) return undefined;
  if (input.runId !== undefined && !isNonEmptyString(input.runId)) return undefined;
  return input.runId === undefined
    ? { afterId: input.afterId }
    : { afterId: input.afterId, runId: input.runId };
}

/** Confirms a published immutable Flow definition reference before calling the host port. */
function isFlowDefinitionRef(value: unknown): value is FlowDefinitionRef {
  return (
    isRecord(value) &&
    isNonEmptyString(value.id) &&
    typeof value.version === 'number' &&
    Number.isSafeInteger(value.version) &&
    value.version > 0
  );
}

/** Confirms Flow's public inline input envelope without re-declaring its DTO locally. */
function isFlowInput(value: unknown): value is RuntimeFlowStartRequest['input'] {
  return (
    isRecord(value) &&
    Object.values(value).every(
      (entry) => isRecord(entry) && entry.kind === 'inline' && 'value' in entry,
    )
  );
}

/** Accepts a nonnegative integer event position so subscriptions can resume deterministically. */
function isEventCursor(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

/** Rejects empty identifiers before a host adapter can issue a remote request. */
function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/** Preserves Flow DTOs as runtime binding data after a successful remote operation. */
function successfulFlowResult(
  data: FlowRunSnapshot | FlowApprovalRequest | readonly FlowRunEvent[],
): RuntimeCapabilityExecutionResult {
  return isSerializableValue(data)
    ? { data, ok: true }
    : {
        diagnostics: [
          {
            code: 'invalid-provider-response',
            message: 'The Flow provider returned a non-serializable response.',
            severity: 'error',
          },
        ],
        ok: false,
      };
}

/** Converts an absent Flow resource into a bindable not-found diagnostic. */
function foundFlowResult(
  data: FlowRunSnapshot | FlowApprovalRequest | undefined,
  resource: string,
): RuntimeCapabilityExecutionResult {
  return data === undefined
    ? {
        diagnostics: [
          {
            code: 'flow-resource-not-found',
            message: `${resource} was not found.`,
            severity: 'error',
          },
        ],
        ok: false,
      }
    : successfulFlowResult(data);
}

/** Reports that the host has not configured the remote Flow capability boundary. */
function missingFlowPortResult(capability: string): RuntimeCapabilityExecutionResult {
  return {
    diagnostics: [
      {
        code: 'missing-adapter',
        message: `Capability '${capability}' requires a configured RuntimeFlowPort.`,
        severity: 'error',
      },
    ],
    ok: false,
  };
}

/** Keeps malformed authored Flow inputs from reaching the remote provider boundary. */
function invalidFlowInputResult(capability: string): RuntimeCapabilityExecutionResult {
  return {
    diagnostics: [
      {
        code: 'invalid-input',
        message: `Capability '${capability}' received an invalid Flow request.`,
        severity: 'error',
      },
    ],
    ok: false,
  };
}

/** Refuses Flow-prefixed actions that are not part of Runtime's released generated-app contract. */
function unsupportedFlowCapabilityResult(capability: string): RuntimeCapabilityExecutionResult {
  return {
    diagnostics: [
      {
        code: 'missing-operation',
        message: `Flow capability '${capability}' is not supported by Runtime.`,
        severity: 'error',
      },
    ],
    ok: false,
  };
}

/** Converts untrusted host failures to fixed public categories without exposing adapter details. */
function flowRequestErrorResult(error: unknown): RuntimeCapabilityExecutionResult {
  const errorCode = isRecord(error) ? error.code : undefined;
  const safeErrors = [
    { code: 'permission-denied', message: 'Flow access was denied.' },
    { code: 'timeout', message: 'The Flow request timed out.' },
    { code: 'unauthenticated', message: 'Flow authentication is required.' },
    { code: 'offline', message: 'The Flow service is unavailable.' },
    { code: 'not-found', message: 'The Flow resource was not found.' },
    { code: 'rate-limited', message: 'The Flow request was rate limited.' },
    { code: 'cancelled', message: 'The Flow request was cancelled.' },
  ] as const;
  const exposed = safeErrors.find(({ code }) => code === errorCode);
  const diagnostic: DataSourceDiagnostic = {
    code: exposed?.code ?? 'flow-request-failed',
    message: exposed?.message ?? 'The Flow request could not be completed.',
    severity: 'error',
  };
  return { diagnostics: [diagnostic], ok: false };
}
