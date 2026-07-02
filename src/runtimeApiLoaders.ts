import type {
  ApiScreenDataLoaderDefinition,
  AppApiCollectionResourceDefinition,
  AppApiDefinition,
  AppDataManifest,
  AppGeneratedApiDefinition,
  StateAdapter,
  StateResult,
  StateValue,
} from '@ankhorage/contracts';
import React from 'react';

import { createRuntimeMemoryStateAdapter } from './runtimeStateAdapter';

export type RuntimeApiLoaderMode = 'byId' | 'list' | 'one' | 'random';

export type RuntimeApiLoaderDefinition = ApiScreenDataLoaderDefinition;

export interface RuntimeApiLoaderDiagnostic {
  readonly code:
    | 'invalid-record'
    | 'missing-api'
    | 'missing-target-path'
    | 'state-set-failed'
    | 'unsupported-loader';
  readonly message: string;
  readonly apiId?: string;
  readonly targetPath?: string;
}

export interface RuntimeApiLoaderExecutionResult {
  readonly diagnostics: readonly RuntimeApiLoaderDiagnostic[];
}

export interface RuntimeApiLoaderMaterializationResult {
  readonly state: Readonly<Record<string, StateValue>>;
  readonly diagnostics: readonly RuntimeApiLoaderDiagnostic[];
}

export function materializeRuntimeApiLoaderState(args: {
  readonly data?: AppDataManifest;
  readonly loaders: readonly RuntimeApiLoaderDefinition[];
}): RuntimeApiLoaderMaterializationResult {
  const state: Record<string, StateValue> = {};
  const diagnostics: RuntimeApiLoaderDiagnostic[] = [];

  for (const loader of args.loaders) {
    const targetPath = loader.targetPath.trim();
    if (targetPath.length === 0) {
      diagnostics.push({
        code: 'missing-target-path',
        apiId: loader.apiId,
        message: `API loader for ${loader.apiId} must define a target path.`,
      });
      continue;
    }

    const api = args.data?.apis?.[loader.apiId];
    const resource = getGeneratedApiCollectionResource(api);
    if (api?.kind !== 'generated' || resource === null) {
      diagnostics.push({
        code: 'missing-api',
        apiId: loader.apiId,
        targetPath,
        message: `Generated API ${loader.apiId} could not be found.`,
      });
      continue;
    }

    const selectedValue = selectApiLoaderValue({ api, resource, loader, diagnostics, targetPath });
    if (selectedValue === undefined) {
      continue;
    }

    const stateValue = toStateValue(selectedValue);
    if (stateValue === undefined) {
      diagnostics.push({
        code: 'invalid-record',
        apiId: loader.apiId,
        targetPath,
        message: `Generated API ${loader.apiId} produced a value that cannot be represented as runtime state.`,
      });
      continue;
    }

    const setResult = writeObjectPath(state, targetPath, stateValue);
    if (!setResult.ok) {
      diagnostics.push({
        code: 'state-set-failed',
        apiId: loader.apiId,
        targetPath,
        message: setResult.error.message,
      });
    }
  }

  return { state, diagnostics };
}

export function executeRuntimeApiLoaders(args: {
  readonly data?: AppDataManifest;
  readonly loaders: readonly RuntimeApiLoaderDefinition[];
  readonly stateAdapter: StateAdapter;
}): RuntimeApiLoaderExecutionResult {
  const materialized = materializeRuntimeApiLoaderState({
    data: args.data,
    loaders: args.loaders,
  });
  const diagnostics: RuntimeApiLoaderDiagnostic[] = [...materialized.diagnostics];

  for (const [targetPath, value] of flattenStateEntries(materialized.state)) {
    const result = args.stateAdapter.set(targetPath, value);
    if (!result.ok) {
      diagnostics.push({
        code: 'state-set-failed',
        targetPath,
        message: result.error.message,
      });
    }
  }

  return { diagnostics };
}

export function useRuntimeApiStateLoaders(args: {
  readonly data?: AppDataManifest;
  readonly loaders?: readonly RuntimeApiLoaderDefinition[];
  readonly stateAdapter?: StateAdapter;
}): {
  readonly diagnostics: readonly RuntimeApiLoaderDiagnostic[];
  readonly stateAdapter: StateAdapter;
  readonly stateVersion: number;
} {
  const fallbackStateAdapter = React.useMemo(() => createRuntimeMemoryStateAdapter(), []);
  const stateAdapter = args.stateAdapter ?? fallbackStateAdapter;
  const loaders = args.loaders ?? [];
  const [stateVersion, setStateVersion] = React.useState(0);
  const [diagnostics, setDiagnostics] = React.useState<readonly RuntimeApiLoaderDiagnostic[]>([]);

  React.useEffect(() => {
    const result = executeRuntimeApiLoaders({
      data: args.data,
      loaders,
      stateAdapter,
    });
    setDiagnostics(result.diagnostics);
    setStateVersion((current) => current + 1);
  }, [args.data, loaders, stateAdapter]);

  return {
    diagnostics,
    stateAdapter,
    stateVersion,
  };
}

function getGeneratedApiCollectionResource(
  api: AppApiDefinition | undefined,
): AppApiCollectionResourceDefinition | null {
  if (api?.kind !== 'generated' || api.resource?.kind !== 'collection') {
    return null;
  }

  return api.resource;
}

function selectApiLoaderValue(args: {
  readonly api: AppGeneratedApiDefinition;
  readonly resource: AppApiCollectionResourceDefinition;
  readonly loader: RuntimeApiLoaderDefinition;
  readonly diagnostics: RuntimeApiLoaderDiagnostic[];
  readonly targetPath: string;
}): unknown {
  const seed = args.resource.seed ?? [];
  const primaryKey = args.resource.collection.primaryKey ?? 'id';

  switch (args.loader.mode) {
    case 'list':
      return seed;
    case 'one':
      return seed[0];
    case 'random': {
      const index = deterministicIndex(args.api.id, seed.length);
      return index === undefined ? undefined : seed[index];
    }
    case 'byId': {
      const loaderId = normalizePrimitiveId(args.loader.id);
      if (loaderId === undefined) return undefined;

      return seed.find((record) => {
        return normalizePrimitiveId(record[primaryKey]) === loaderId;
      });
    }
    default:
      args.diagnostics.push({
        code: 'unsupported-loader',
        apiId: args.loader.apiId,
        targetPath: args.targetPath,
        message: `API loader mode ${String(args.loader.mode)} is not supported.`,
      });
      return undefined;
  }
}

function normalizePrimitiveId(value: unknown): string | undefined {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return Number.isFinite(value) ? value.toString() : undefined;
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return undefined;
}

function deterministicIndex(apiId: string, length: number): number | undefined {
  if (length === 0) return undefined;

  let hash = 0;
  for (const char of apiId) {
    hash = (hash * 31 + char.charCodeAt(0)) % length;
  }

  return hash;
}

function writeObjectPath(
  target: Record<string, StateValue>,
  path: string,
  value: StateValue,
): StateResult {
  const parts = path
    .split('.')
    .map((part) => part.trim())
    .filter(Boolean);
  const [head, ...tail] = parts;

  if (head === undefined) {
    return {
      ok: false,
      error: {
        code: 'invalid_path',
        message: 'State target path must contain at least one segment.',
      },
    };
  }

  if (tail.length === 0) {
    target[head] = value;
    return { ok: true };
  }

  const existing = target[head];
  const child = existing === undefined ? {} : existing;
  if (!isMutableStateRecord(child)) {
    return {
      ok: false,
      error: {
        code: 'path_conflict',
        message: `Cannot set nested state below non-object path segment "${head}".`,
      },
    };
  }

  target[head] = child;
  return writeObjectPath(child, tail.join('.'), value);
}

function flattenStateEntries(
  source: Readonly<Record<string, StateValue>>,
  prefix = '',
): readonly (readonly [string, StateValue])[] {
  return Object.entries(source).flatMap(([key, value]) => {
    const path = prefix.length > 0 ? `${prefix}.${key}` : key;
    return [[path, value]] as const;
  });
}

function toStateValue(value: unknown): StateValue | undefined {
  if (value === null) return null;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  if (Array.isArray(value)) {
    const items: StateValue[] = [];
    for (const item of value) {
      const stateItem = toStateValue(item);
      if (stateItem === undefined) return undefined;
      items.push(stateItem);
    }
    return items;
  }

  if (!isUnknownRecord(value)) return undefined;

  const record: Record<string, StateValue> = {};
  for (const [key, entry] of Object.entries(value)) {
    const stateEntry = toStateValue(entry);
    if (stateEntry === undefined) return undefined;
    record[key] = stateEntry;
  }

  return record;
}

function isUnknownRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value != null && !Array.isArray(value);
}

function isMutableStateRecord(value: StateValue): value is Record<string, StateValue> {
  return typeof value === 'object' && value != null && !Array.isArray(value);
}
