import type { Capability } from '@ankhorage/contracts/capabilities';

export const CAPABILITIES = [
  {
    id: 'runtime.render',
    owner: '@ankhorage/runtime',
    access: ['invoke'],
    binding: {
      kind: 'action',
      bindableAs: ['target'],
    },
    label: 'Render runtime',
  },
  {
    id: 'runtime.actions',
    owner: '@ankhorage/runtime',
    access: ['invoke'],
    binding: {
      kind: 'action',
      bindableAs: ['target'],
    },
    label: 'Execute runtime actions',
  },
  {
    id: 'runtime.bindings',
    owner: '@ankhorage/runtime',
    access: ['read', 'write'],
    binding: {
      kind: 'state',
      bindableAs: ['source', 'target'],
    },
    label: 'Runtime bindings',
  },
  {
    id: 'runtime.adapters',
    owner: '@ankhorage/runtime',
    access: ['read'],
    binding: {
      kind: 'context',
      bindableAs: ['source'],
    },
    label: 'Runtime adapters',
  },
] as const satisfies readonly Capability[];
