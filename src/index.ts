export const RUNTIME_MANIFEST_KIND = "ankhorage-runtime-manifest";

export interface RuntimeConfig {
  readonly appId: string;
}

export interface RuntimeManifest {
  readonly config: RuntimeConfig;
  readonly kind: typeof RUNTIME_MANIFEST_KIND;
  readonly version: 1;
}

export function createRuntimeManifest(config: RuntimeConfig): RuntimeManifest {
  return {
    config,
    kind: RUNTIME_MANIFEST_KIND,
    version: 1,
  };
}
