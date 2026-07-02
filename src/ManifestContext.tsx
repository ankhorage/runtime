import type { AppManifest } from '@ankhorage/contracts';
import React, { createContext, useContext } from 'react';

interface ManifestContextValue {
  manifest: AppManifest;
  activeScreenId?: string;
  onScreenChange?: (screenId: string) => void;
}

export const ManifestContext = createContext<ManifestContextValue | null>(null);

export function ManifestProvider(props: ManifestContextValue & { children: React.ReactNode }) {
  const { manifest, activeScreenId, onScreenChange, children } = props;

  return (
    <ManifestContext.Provider value={{ manifest, activeScreenId, onScreenChange }}>
      {children}
    </ManifestContext.Provider>
  );
}

export function useManifest() {
  const context = useContext(ManifestContext);
  if (!context) {
    throw new Error('useManifest must be used within a ManifestProvider');
  }
  return context.manifest;
}

export function useManifestContext() {
  const context = useContext(ManifestContext);
  if (!context) {
    throw new Error('useManifestContext must be used within a ManifestProvider');
  }
  return context;
}

export function useOptionalManifestContext() {
  return useContext(ManifestContext);
}
