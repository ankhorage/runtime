import type { AppManifest, StateAdapter } from '@ankhorage/contracts';
import React, { createContext, use } from 'react';

import { createRuntimeMemoryStateAdapter } from './runtimeStateAdapter';

export interface ManifestContextValue {
  manifest: AppManifest;
  activeScreenId?: string;
  onScreenChange?: (screenId: string) => void;
  stateAdapter?: StateAdapter;
}

export const ManifestContext = createContext<ManifestContextValue | null>(null);

/*** Owns one configured state adapter for every Runtime screen in an application tree. */
export function ManifestProvider(props: ManifestContextValue & { children: React.ReactNode }) {
  const {
    manifest,
    activeScreenId,
    onScreenChange,
    stateAdapter: injectedStateAdapter,
    children,
  } = props;
  const fallbackStateAdapter = React.useMemo(
    () => (manifest.state?.provider === 'legend' ? createRuntimeMemoryStateAdapter() : undefined),
    [manifest.state?.provider],
  );
  const stateAdapter = injectedStateAdapter ?? fallbackStateAdapter;

  return (
    <ManifestContext value={{ manifest, activeScreenId, onScreenChange, stateAdapter }}>
      {children}
    </ManifestContext>
  );
}

/*** Returns the active application manifest from the owning Runtime provider. */
export function useManifest() {
  const context = use(ManifestContext);
  if (!context) {
    throw new Error('useManifest must be used within a ManifestProvider');
  }
  return context.manifest;
}

/*** Returns the active manifest scope, including its application-lifetime state adapter. */
export function useManifestContext() {
  const context = use(ManifestContext);
  if (!context) {
    throw new Error('useManifestContext must be used within a ManifestProvider');
  }
  return context;
}

/*** Reads an enclosing manifest scope without requiring hosts to provide one. */
export function useOptionalManifestContext() {
  return use(ManifestContext);
}
