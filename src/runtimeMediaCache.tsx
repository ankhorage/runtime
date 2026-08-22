import React, { createContext, use, useMemo } from 'react';

import {
  createRuntimeMediaResolutionCache,
  type RuntimeMediaResolutionCache,
} from './runtimeMedia';

const RuntimeMediaCacheContext = createContext<RuntimeMediaResolutionCache | null>(null);

export function useRuntimeMediaResolutionCache(): RuntimeMediaResolutionCache {
  const inherited = use(RuntimeMediaCacheContext);
  const local = useMemo(() => createRuntimeMediaResolutionCache(), []);
  return inherited ?? local;
}

export function RuntimeMediaResolutionCacheProvider(props: {
  readonly value: RuntimeMediaResolutionCache;
  readonly children: React.ReactNode;
}) {
  return <RuntimeMediaCacheContext value={props.value}>{props.children}</RuntimeMediaCacheContext>;
}
