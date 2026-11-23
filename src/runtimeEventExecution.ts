import type { DataSourceDiagnostic } from '@ankhorage/contracts';

import {
  dispatchRuntimeComponentEvent,
  type RuntimeComponentEventDispatchArgs,
} from './runtimeActionRegistry.js';

export interface RuntimeEventDiagnosticsReporter {
  readonly onDiagnostics?: (diagnostics: readonly DataSourceDiagnostic[]) => void;
  readonly consoleImpl?: Pick<Console, 'error' | 'warn'>;
}

export async function dispatchRuntimeComponentEventWithReporting(
  args: RuntimeComponentEventDispatchArgs & RuntimeEventDiagnosticsReporter,
): Promise<readonly DataSourceDiagnostic[]> {
  const diagnostics = await dispatchRuntimeComponentEvent(args);
  const safeDiagnostics = redactRuntimeEventDiagnostics(diagnostics);

  if (args.onDiagnostics !== undefined) {
    args.onDiagnostics(safeDiagnostics);
    return safeDiagnostics;
  }

  if (safeDiagnostics.length === 0) {
    return safeDiagnostics;
  }

  const report = safeDiagnostics.some((diagnostic) => diagnostic.severity === 'error')
    ? args.consoleImpl?.error
    : args.consoleImpl?.warn;

  report?.('[runtime] Event binding diagnostics', safeDiagnostics);

  return safeDiagnostics;
}

/*** Redacts credential and endpoint details before event diagnostics leave the trusted host boundary. */
function redactRuntimeEventDiagnostics(
  diagnostics: readonly DataSourceDiagnostic[],
): readonly DataSourceDiagnostic[] {
  return diagnostics.map((diagnostic) =>
    containsSensitiveDiagnosticDetail(diagnostic)
      ? {
          code: 'adapter-error',
          message: 'The operation could not be completed. Please try again.',
          severity: diagnostic.severity,
        }
      : diagnostic,
  );
}

/*** Detects diagnostic fields that could disclose a server credential or private transport endpoint. */
function containsSensitiveDiagnosticDetail(diagnostic: DataSourceDiagnostic): boolean {
  const detail = `${diagnostic.code} ${diagnostic.message}`.toLowerCase();
  return [
    'authorization',
    'basic ',
    'bearer ',
    'credential',
    'secret',
    'token',
    'http://',
    'https://',
  ].some((marker) => detail.includes(marker));
}
