import type { DataSchema } from '@ankhorage/contracts';
import type { Capability } from '@ankhorage/contracts/capability';

import { CAPABILITIES } from './index';

export type RuntimeContextCapabilityId = 'runtime.eventOperation' | 'runtime.repeat.item';

export type RuntimeContextCapabilityResolution =
  | { readonly ok: true; readonly capability: Capability }
  | {
      readonly ok: false;
      readonly reason: 'invalid-repeat-item-schema' | 'unavailable-capability';
    };

/*** Materializes a Runtime-owned context capability for the active renderer scope. */
export function resolveRuntimeContextCapability(args: {
  readonly id: string;
  readonly repeatSourceSchema?: DataSchema;
}): RuntimeContextCapabilityResolution {
  if (args.id === 'runtime.repeat.item') {
    const repeatItemSchema = resolveRepeatItemSchema(args.repeatSourceSchema);
    if (repeatItemSchema === undefined) {
      return { ok: false, reason: 'invalid-repeat-item-schema' };
    }

    const capability = findRuntimeContextCapability('runtime.repeat.item');
    if (capability === undefined) return { ok: false, reason: 'unavailable-capability' };

    return {
      ok: true,
      capability: {
        ...capability,
        output: { schema: repeatItemSchema },
      },
    };
  }

  const capability = findRuntimeContextCapability(args.id);
  return capability === undefined
    ? { ok: false, reason: 'unavailable-capability' }
    : { ok: true, capability };
}

/*** Determines whether a dot-separated path is exposed by a capability output schema. */
export function isRuntimeContextCapabilityOutputPath(args: {
  readonly capability: Capability;
  readonly path: string;
}): boolean {
  const outputSchema = args.capability.output?.schema;
  if (outputSchema === undefined || args.path.length === 0) return false;

  return (
    args.path
      .split('.')
      .reduce<DataSchema | undefined>(
        (schema, part) => (schema === undefined ? undefined : resolveSchemaPathPart(schema, part)),
        outputSchema,
      ) !== undefined
  );
}

/*** Finds a Runtime-owned context descriptor without accepting host-provided context roots. */
function findRuntimeContextCapability(id: string): Capability | undefined {
  return CAPABILITIES.find(
    (capability) => capability.id === id && capability.binding.kind === 'context',
  );
}

/*** Resolves one schema path segment without treating arbitrary object fields as declared output. */
function resolveSchemaPathPart(schema: DataSchema, part: string): DataSchema | undefined {
  if (Array.isArray(schema.type) ? schema.type.includes('array') : schema.type === 'array') {
    return /^(0|[1-9]\\d*)$/.test(part) ? schema.items : undefined;
  }

  const property = Object.entries(schema.properties ?? {}).find(([key]) => key === part)?.[1];
  if (property !== undefined) return property;
  return typeof schema.additionalProperties === 'object' ? schema.additionalProperties : undefined;
}

/*** Derives the item schema only from an enclosing declared repeat-source array. */
function resolveRepeatItemSchema(schema: DataSchema | undefined): DataSchema | undefined {
  const types =
    schema === undefined ? [] : Array.isArray(schema.type) ? schema.type : [schema.type];
  return types.includes('array') ? schema?.items : undefined;
}
