import type {
  FlowApprovalRequest,
  FlowDefinitionRef,
  FlowRunSnapshot,
} from '@ankhorage/contracts/flow';
import type { FlowRunEvent, FlowRuntime } from '@ankhorage/flow';

/** A generated-app request that binds a published immutable Flow revision to a manual trigger. */
export type RuntimeFlowStartRequest = Omit<
  Parameters<FlowRuntime['triggerAsync']>[0],
  'flowId' | 'scope'
> & {
  readonly flow: FlowDefinitionRef;
};

/** A remote Flow boundary selected by the generated app host. Authentication stays in its adapter. */
export interface RuntimeFlowPort {
  readonly startAsync: (request: RuntimeFlowStartRequest) => Promise<FlowRunSnapshot>;
  readonly statusAsync: (runId: string) => Promise<FlowRunSnapshot | undefined>;
  readonly cancelAsync: (runId: string) => Promise<FlowRunSnapshot | undefined>;
  readonly resolveApprovalAsync: (request: {
    readonly approvalId: string;
    readonly approved: boolean;
  }) => Promise<FlowApprovalRequest | undefined>;
  readonly eventsAsync: (request: {
    readonly afterId: number;
    readonly runId?: string;
  }) => Promise<readonly FlowRunEvent[]>;
}
