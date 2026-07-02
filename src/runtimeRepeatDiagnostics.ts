import type { DataSourceDiagnostic } from '@ankhorage/contracts';

export function createRepeatDiagnosticsKey(
  nodeId: string,
  diagnostics: readonly DataSourceDiagnostic[],
): string {
  return JSON.stringify({
    nodeId,
    diagnostics: diagnostics.map((diagnostic) => ({
      code: diagnostic.code,
      message: diagnostic.message,
      severity: diagnostic.severity,
      dataSourceId: diagnostic.dataSourceId,
      endpointId: diagnostic.endpointId,
      operationId: diagnostic.operationId,
    })),
  });
}
