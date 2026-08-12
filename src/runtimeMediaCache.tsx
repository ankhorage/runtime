import React, { createContext, useContext, useMemo } from 'react';

import {
  createRuntimeMediaResolutionCache,
  type RuntimeMediaResolutionCache,
} from './runtimeMedia';

const RuntimeMediaCacheContext = createContext<RuntimeMediaResolutionCache | null>(null);

export function useRuntimeMediaResolutionCache(): RuntimeMediaResolutionCache {
  const inherited = useContext(RuntimeMediaCacheContext);
  const local = useMemo(() => createRuntimeMediaResolutionCache(), []);
  return inherited ?? local;
}

export function RuntimeMediaResolutionCacheProvider(props: {
  readonly value: RuntimeMediaResolutionCache;
  readonly children: React.ReactNode;
}) {
  return (
    <RuntimeMediaCacheContext.Provider value={props.value}>
      {props.children}
    </RuntimeMediaCacheContext.Provider>
  );
}
