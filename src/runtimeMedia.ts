import {
  isMediaAssetReference,
  type MediaAsset,
  type MediaAssetRegistry,
} from '@ankhorage/contracts';

export type RuntimeResolvedMediaValue =
  | string
  | number
  | Readonly<Record<string, unknown>>;

export interface RuntimeMediaAssetResolverArgs {
  readonly asset: MediaAsset;
}

export type RuntimeMediaAssetResolver = (
  args: RuntimeMediaAssetResolverArgs,
) => Promise<RuntimeResolvedMediaValue | null> | RuntimeResolvedMediaValue | null;

export type RuntimeMediaResolutionCache = WeakMap<
  MediaAsset,
  WeakMap<RuntimeMediaAssetResolver, Promise<RuntimeResolvedMediaValue | null>>
>;

const OMIT_MEDIA_VALUE = Symbol('omit-runtime-media-value');

export function createRuntimeMediaResolutionCache(): RuntimeMediaResolutionCache {
  return new WeakMap();
}

export function collectRuntimeMediaReferenceIds(value: unknown): readonly string[] {
  const ids = new Set<string>();
  collectMediaReferenceIds(value, ids);
  return [...ids].sort();
}

export function replaceRuntimeMediaReferences(
  value: unknown,
  resolvedById: ReadonlyMap<string, RuntimeResolvedMediaValue>,
): unknown {
  const replaced = replaceMediaValue(value, resolvedById);
  return replaced === OMIT_MEDIA_VALUE ? undefined : replaced;
}

export function resolveRuntimeMediaAsset(
  asset: MediaAsset,
  resolver: RuntimeMediaAssetResolver | undefined,
  cache: RuntimeMediaResolutionCache,
): Promise<RuntimeResolvedMediaValue | null> {
  if (asset.source.kind === 'url') return Promise.resolve(asset.source.url);
  if (!resolver) return Promise.resolve(null);

  let resolverCache = cache.get(asset);
  if (!resolverCache) {
    resolverCache = new WeakMap();
    cache.set(asset, resolverCache);
  }

  const cached = resolverCache.get(resolver);
  if (cached) return cached;

  const pending = Promise.resolve(resolver({ asset })).catch(() => null);
  resolverCache.set(resolver, pending);
  return pending;
}

export function createSyncRuntimeMediaResolutionMap(
  ids: readonly string[],
  mediaAssets: MediaAssetRegistry | undefined,
): Map<string, RuntimeResolvedMediaValue> {
  const resolved = new Map<string, RuntimeResolvedMediaValue>();

  for (const id of ids) {
    const asset = mediaAssets?.[id];
    if (asset?.source.kind === 'url') resolved.set(id, asset.source.url);
  }

  return resolved;
}

function collectMediaReferenceIds(value: unknown, ids: Set<string>): void {
  if (isMediaAssetReference(value)) {
    ids.add(value.mediaId.trim());
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item) => collectMediaReferenceIds(item, ids));
    return;
  }

  if (!isPlainObject(value)) return;
  Object.values(value).forEach((item) => collectMediaReferenceIds(item, ids));
}

function replaceMediaValue(
  value: unknown,
  resolvedById: ReadonlyMap<string, RuntimeResolvedMediaValue>,
): unknown {
  if (isMediaAssetReference(value)) {
    return resolvedById.get(value.mediaId.trim()) ?? OMIT_MEDIA_VALUE;
  }

  if (Array.isArray(value)) {
    return value.map((item) => {
      const replaced = replaceMediaValue(item, resolvedById);
      return replaced === OMIT_MEDIA_VALUE ? undefined : replaced;
    });
  }

  if (!isPlainObject(value)) return value;

  const result: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value)) {
    const replaced = replaceMediaValue(item, resolvedById);
    if (replaced !== OMIT_MEDIA_VALUE) result[key] = replaced;
  }
  return result;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const prototype = Reflect.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}
