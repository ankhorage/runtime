import type { Capability } from '@ankhorage/contracts/capabilities';

export const CAPABILITIES = [
  {
    id: 'runtime.render',
    owner: '@ankhorage/runtime',
    access: ['invoke'],
    label: 'Render runtime',
  },
  {
    id: 'runtime.actions',
    owner: '@ankhorage/runtime',
    access: ['invoke'],
    label: 'Execute runtime actions',
  },
  {
    id: 'runtime.bindings',
    owner: '@ankhorage/runtime',
    access: ['read', 'write'],
    label: 'Runtime bindings',
  },
  {
    id: 'runtime.adapters',
    owner: '@ankhorage/runtime',
    access: ['read'],
    label: 'Runtime adapters',
  },
] as const satisfies readonly Capability[];
