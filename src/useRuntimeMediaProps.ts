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
  const [asyncResolved, setAsyncResolved] = React.useState<{
    readonly idsKey: string;
    readonly values: ReadonlyMap<string, RuntimeResolvedMediaValue>;
  }>(() => ({ idsKey, values: new Map() }));

  React.useEffect(() => {
    let active = true;
    const effectIds = idsKey.length === 0 ? [] : idsKey.split('\u0000');

    for (const id of effectIds) {
      const asset = args.mediaAssets?.[id];
      if (!asset || asset.source.kind === 'url') continue;

      void resolveRuntimeMediaAsset(asset, args.resolveMediaAsset, args.cache).then((value) => {
        if (!active || value === null) return;
        setAsyncResolved((current) => {
          const currentValues = current.idsKey === idsKey ? current.values : new Map();
          if (currentValues.get(id) === value) return current;
          const next = new Map(currentValues);
          next.set(id, value);
          return { idsKey, values: next };
        });
      });
    }

    return () => {
      active = false;
    };
  }, [args.cache, args.mediaAssets, args.resolveMediaAsset, idsKey]);

  const resolved = createSyncRuntimeMediaResolutionMap(ids, args.mediaAssets);
  const currentIds = new Set(ids);
  if (asyncResolved.idsKey === idsKey) {
    asyncResolved.values.forEach((value, id) => {
      if (currentIds.has(id)) resolved.set(id, value);
    });
  }

  const replaced = replaceRuntimeMediaReferences(args.props, resolved);
  return isRecord(replaced) ? replaced : {};
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
