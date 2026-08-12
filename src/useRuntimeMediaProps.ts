import type { MediaAssetRegistry } from '@ankhorage/contracts';
import React from 'react';

import {
  collectRuntimeMediaReferenceIds,
  createSyncRuntimeMediaResolutionMap,
  replaceRuntimeMediaReferences,
  resolveRuntimeMediaAsset,
  type RuntimeMediaAssetResolver,
  type RuntimeMediaResolutionCache,
  type RuntimeResolvedMediaValue,
} from './runtimeMedia';

export function useRuntimeMediaProps(args: {
  readonly props: Record<string, unknown>;
  readonly mediaAssets?: MediaAssetRegistry;
  readonly resolveMediaAsset?: RuntimeMediaAssetResolver;
  readonly cache: RuntimeMediaResolutionCache;
}): Record<string, unknown> {
  const ids = collectRuntimeMediaReferenceIds(args.props);
  const idsKey = ids.join('\u0000');
  const [asyncResolved, setAsyncResolved] = React.useState(
    () => new Map<string, RuntimeResolvedMediaValue>(),
  );

  React.useEffect(() => {
    let active = true;
    const currentIds = new Set(ids);
    setAsyncResolved((current) => filterResolvedValues(current, currentIds));

    for (const id of ids) {
      const asset = args.mediaAssets?.[id];
      if (!asset || asset.source.kind === 'url') continue;

      void resolveRuntimeMediaAsset(asset, args.resolveMediaAsset, args.cache).then((value) => {
        if (!active || value === null) return;
        setAsyncResolved((current) => {
          if (current.get(id) === value) return current;
          const next = new Map(current);
          next.set(id, value);
          return next;
        });
      });
    }

    return () => {
      active = false;
    };
  }, [args.cache, args.mediaAssets, args.resolveMediaAsset, idsKey]);

  const resolved = createSyncRuntimeMediaResolutionMap(ids, args.mediaAssets);
  asyncResolved.forEach((value, id) => {
    if (ids.includes(id)) resolved.set(id, value);
  });

  const replaced = replaceRuntimeMediaReferences(args.props, resolved);
  return isRecord(replaced) ? replaced : {};
}

function filterResolvedValues(
  current: ReadonlyMap<string, RuntimeResolvedMediaValue>,
  ids: ReadonlySet<string>,
): Map<string, RuntimeResolvedMediaValue> {
  const next = new Map<string, RuntimeResolvedMediaValue>();
  current.forEach((value, id) => {
    if (ids.has(id)) next.set(id, value);
  });
  return mapsEqual(current, next) ? (current as Map<string, RuntimeResolvedMediaValue>) : next;
}

function mapsEqual(
  left: ReadonlyMap<string, RuntimeResolvedMediaValue>,
  right: ReadonlyMap<string, RuntimeResolvedMediaValue>,
): boolean {
  if (left.size !== right.size) return false;
  for (const [key, value] of left) {
    if (right.get(key) !== value) return false;
  }
  return true;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
