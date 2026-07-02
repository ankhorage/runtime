import type { DataSourceDiagnostic } from '@ankhorage/contracts';

import {
  dispatchRuntimeComponentEvent,
  type RuntimeComponentEventDispatchArgs,
} from './runtimeActionRegistry';
import type { RuntimeActionHandlers } from './RuntimeRendererConfig';

export interface RuntimeEventDiagnosticsReporter {
  readonly onDiagnostics?: (diagnostics: readonly DataSourceDiagnostic[]) => void;
  readonly consoleImpl?: Pick<Console, 'error' | 'warn'>;
}

export async function dispatchRuntimeComponentEventWithReporting(
  args: RuntimeComponentEventDispatchArgs &
    RuntimeEventDiagnosticsReporter & {
      readonly actionHandlers?: RuntimeActionHandlers;
    },
): Promise<readonly DataSourceDiagnostic[]> {
  const diagnostics = await dispatchRuntimeComponentEvent(args);

  if (args.onDiagnostics !== undefined) {
    args.onDiagnostics(diagnostics);
    return diagnostics;
  }

  if (diagnostics.length === 0) {
    return diagnostics;
  }

  const report = diagnostics.some((diagnostic) => diagnostic.severity === 'error')
    ? args.consoleImpl?.error
    : args.consoleImpl?.warn;

  report?.('[runtime] Event binding diagnostics', diagnostics);

  return diagnostics;
}
