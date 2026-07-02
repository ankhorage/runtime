import type { BindingValue, DataSourceDiagnostic } from '@ankhorage/contracts';

export function shouldRenderRuntimeRepeatEmptyState(args: {
  readonly diagnostics?: readonly DataSourceDiagnostic[];
  readonly items?: readonly BindingValue[];
  readonly status?: 'pending' | 'ready';
}): boolean {
  if (args.status !== 'ready') {
    return false;
  }

  if (!Array.isArray(args.items) || args.items.length > 0) {
    return false;
  }

  return !(args.diagnostics ?? []).some((diagnostic) => diagnostic.severity === 'error');
}
