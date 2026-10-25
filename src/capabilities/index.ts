import type { Capability } from '@ankhorage/contracts/capability';

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
    id: 'state.set',
    owner: '@ankhorage/runtime',
    access: ['invoke', 'write'],
    binding: {
      kind: 'state',
      bindableAs: ['target'],
    },
    label: 'Set runtime state',
    input: {
      schema: {
        type: 'object',
        required: ['path', 'value'],
        properties: {
          path: {
            anyOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
          },
          value: {},
        },
      },
    },
    output: {
      schema: {
        type: 'object',
        required: ['path', 'value'],
        properties: {
          path: {
            anyOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
          },
          value: {},
        },
      },
    },
  },
  {
    id: 'state.update',
    owner: '@ankhorage/runtime',
    access: ['invoke', 'write'],
    binding: {
      kind: 'state',
      bindableAs: ['target'],
    },
    label: 'Update runtime state',
    input: {
      schema: {
        type: 'object',
        required: ['path', 'update'],
        properties: {
          path: {
            anyOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
          },
          update: {
            type: 'object',
            required: ['kind', 'value'],
            properties: {
              kind: { type: 'string', enum: ['append'] },
              value: {},
            },
          },
        },
      },
    },
    output: {
      schema: {
        type: 'object',
        required: ['path', 'value'],
        properties: {
          path: {
            anyOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
          },
          value: { type: 'array' },
        },
      },
    },
  },
  {
    id: 'runtime.eventOperation',
    owner: '@ankhorage/runtime',
    access: ['read', 'subscribe'],
    binding: {
      kind: 'context',
      bindableAs: ['source'],
    },
    label: 'Runtime event operation',
    output: {
      schema: {
        type: 'object',
        required: ['status', 'loading', 'errorMessage'],
        properties: {
          status: { type: 'string', enum: ['idle', 'loading', 'success', 'error'] },
          loading: { type: 'boolean' },
          errorMessage: { type: 'string' },
          nodeId: { type: 'string' },
          operation: {
            type: 'object',
            required: ['apiId', 'operationId'],
            properties: {
              apiId: { type: 'string' },
              endpointId: { type: 'string' },
              operationId: { type: 'string' },
            },
          },
        },
      },
    },
  },
  {
    id: 'runtime.repeat.item',
    owner: '@ankhorage/runtime',
    access: ['read'],
    binding: {
      kind: 'context',
      bindableAs: ['source'],
    },
    label: 'Runtime repeat item',
  },
] as const satisfies readonly Capability[];
