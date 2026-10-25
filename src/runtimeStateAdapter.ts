import type {
  StateAdapter,
  StateAdapterError,
  StateListener,
  StatePath,
  StateResult,
  StateSubscription,
  StateUpdate,
  StateValue,
} from '@ankhorage/contracts';

type MutableStateRecord = Record<string, StateValue>;
type StateListenerSet = Set<(value: StateValue | undefined) => void>;
interface StateListenerEntry {
  readonly listeners: StateListenerSet;
  readonly parts: readonly string[];
}

export interface RuntimeMemoryStateAdapterOptions {
  readonly initialState?: Readonly<Record<string, StateValue>>;
}

export function createRuntimeMemoryStateAdapter(
  options: RuntimeMemoryStateAdapterOptions = {},
): StateAdapter {
  let rootState: MutableStateRecord = { ...(options.initialState ?? {}) };
  const listeners = new Map<string, StateListenerEntry>();

  const emit = (path: StatePath) => {
    const pathResult = normalizeStatePath(path);
    if (!pathResult.ok) return;

    for (const entry of listeners.values()) {
      if (!areStatePathsRelated(pathResult.parts, entry.parts)) continue;

      const value = readStatePath(rootState, entry.parts);
      for (const listener of entry.listeners) {
        listener(value);
      }
    }
  };

  return {
    capabilities: {
      subscriptions: true,
      computed: false,
      persistence: false,
    },
    get<TValue extends StateValue = StateValue>(path: StatePath): StateResult<TValue | undefined> {
      const pathResult = normalizeStatePath(path);
      if (!pathResult.ok) return pathResult;

      return createStateDataResult(
        readStatePath(rootState, pathResult.parts) as TValue | undefined,
      );
    },
    set<TValue extends StateValue = StateValue>(path: StatePath, value: TValue): StateResult {
      const pathResult = normalizeStatePath(path);
      if (!pathResult.ok) return pathResult;

      const nextStateResult = setStatePath(rootState, pathResult.parts, value);
      if (!nextStateResult.ok) return nextStateResult;

      rootState = nextStateResult.data;
      emit(path);
      return { ok: true };
    },
    update<TValue extends StateValue = StateValue>(
      path: StatePath,
      update: StateUpdate,
    ): StateResult<TValue> {
      const pathResult = normalizeStatePath(path);
      if (!pathResult.ok) return pathResult;

      const updateResult = applyStateUpdate(readStatePath(rootState, pathResult.parts), update);
      if (!updateResult.ok) return updateResult;

      const nextStateResult = setStatePath(rootState, pathResult.parts, updateResult.data);
      if (!nextStateResult.ok) return nextStateResult;

      rootState = nextStateResult.data;
      emit(path);
      return createStateDataResult(updateResult.data as TValue);
    },
    subscribe<TValue extends StateValue = StateValue>(
      path: StatePath,
      listener: StateListener<TValue>,
    ): StateResult<StateSubscription> {
      const pathResult = normalizeStatePath(path);
      if (!pathResult.ok) return pathResult;

      const key = pathPartsToKey(pathResult.parts);
      const entry = listeners.get(key) ?? {
        listeners: new Set<(value: StateValue | undefined) => void>(),
        parts: pathResult.parts,
      };
      const wrappedListener = (value: StateValue | undefined) => {
        listener({ path, value: value as TValue | undefined });
      };

      entry.listeners.add(wrappedListener);
      listeners.set(key, entry);

      return createStateDataResult({
        unsubscribe() {
          entry.listeners.delete(wrappedListener);
          if (entry.listeners.size === 0) {
            listeners.delete(key);
          }
        },
      });
    },
    delete(path: StatePath): StateResult {
      const pathResult = normalizeStatePath(path);
      if (!pathResult.ok) return pathResult;

      const nextStateResult = deleteStatePath(rootState, pathResult.parts);
      if (!nextStateResult.ok) return nextStateResult;

      rootState = nextStateResult.data;
      emit(path);
      return { ok: true };
    },
  };
}

interface ResolvedStatePath {
  readonly ok: true;
  readonly parts: readonly string[];
}

interface StatePathError {
  readonly ok: false;
  readonly error: StateAdapterError;
}

type StatePathResult = ResolvedStatePath | StatePathError;

function normalizeStatePath(path: StatePath): StatePathResult {
  const parts = typeof path === 'string' ? path.split('.') : [...path];
  const normalized = parts.map((part) => part.trim()).filter(Boolean);

  if (normalized.length === 0) {
    return createStateError('invalid_path', 'State path must contain at least one segment.');
  }

  return {
    ok: true,
    parts: normalized,
  };
}

function pathPartsToKey(parts: readonly string[]): string {
  return parts.join('.');
}

/*** Determines whether a state mutation changes an ancestor, descendant, or exact subscription. */
function areStatePathsRelated(
  changedParts: readonly string[],
  subscribedParts: readonly string[],
): boolean {
  const sharedLength = Math.min(changedParts.length, subscribedParts.length);
  return changedParts
    .slice(0, sharedLength)
    .every((part, index) => part === subscribedParts[index]);
}

function readStatePath(
  source: MutableStateRecord,
  parts: readonly string[],
): StateValue | undefined {
  let currentValue: StateValue | undefined = source;

  for (const part of parts) {
    if (!isStateRecord(currentValue)) {
      return undefined;
    }

    currentValue = currentValue[part];
  }

  return currentValue;
}

function setStatePath(
  source: MutableStateRecord,
  parts: readonly string[],
  value: StateValue,
): StateResult<MutableStateRecord> {
  const [head, ...tail] = parts;
  if (head === undefined) {
    return createStateError('invalid_path', 'State path must contain at least one segment.');
  }

  if (tail.length === 0) {
    return createStateDataResult({
      ...source,
      [head]: value,
    });
  }

  const existing = source[head];
  const child = existing === undefined ? {} : existing;
  if (!isStateRecord(child)) {
    return createStateError(
      'path_conflict',
      `Cannot set nested state below non-object path segment "${head}".`,
    );
  }

  const childResult = setStatePath(child, tail, value);
  if (!childResult.ok) return childResult;

  return createStateDataResult({
    ...source,
    [head]: childResult.data,
  });
}

/*** Applies one supported atomic update without observing an intermediate state. */
function applyStateUpdate(
  value: StateValue | undefined,
  update: StateUpdate,
): StateResult<StateValue> {
  if (!Array.isArray(value)) {
    return createStateError(
      'incompatible_value',
      'Append updates require an existing array state value.',
    );
  }

  return createStateDataResult(value.concat(update.value));
}

function deleteStatePath(
  source: MutableStateRecord,
  parts: readonly string[],
): StateResult<MutableStateRecord> {
  const [head, ...tail] = parts;
  if (head === undefined) {
    return createStateError('invalid_path', 'State path must contain at least one segment.');
  }

  if (tail.length === 0) {
    const nextState: MutableStateRecord = {};
    for (const [key, value] of Object.entries(source)) {
      if (key !== head) {
        nextState[key] = value;
      }
    }

    return createStateDataResult(nextState);
  }

  const existing = source[head];
  if (existing === undefined) {
    return createStateDataResult(source);
  }

  if (!isStateRecord(existing)) {
    return createStateError(
      'path_conflict',
      `Cannot delete nested state below non-object path segment "${head}".`,
    );
  }

  const childResult = deleteStatePath(existing, tail);
  if (!childResult.ok) return childResult;

  return createStateDataResult({
    ...source,
    [head]: childResult.data,
  });
}

function isStateRecord(value: StateValue | undefined): value is MutableStateRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function createStateError(code: string, message: string): StatePathError {
  const error: StateAdapterError = { code, message };
  return { ok: false, error };
}

function createStateDataResult<TValue>(data: TValue): StateResult<TValue> {
  const result = {
    ok: true,
    data,
  };

  return result as StateResult<TValue>;
}
