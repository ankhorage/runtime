export const RUNTIME_CAPABILITIES = [
  'runtime.render',
  'runtime.actions',
  'runtime.bindings',
  'runtime.adapters',
] as const;

export const RUNTIME_MANIFEST_KIND = 'ankhorage-runtime-manifest';

export type RuntimeCapability = (typeof RUNTIME_CAPABILITIES)[number];

export interface RuntimeDiagnostic {
  readonly code: string;
  readonly message: string;
  readonly severity: 'error' | 'info' | 'warning';
}

export interface RuntimeManifestConfig {
  readonly appId: string;
  readonly environment?: string;
  readonly values?: Readonly<Record<string, unknown>>;
}

export interface RuntimeActionDescriptor<Data = unknown> {
  readonly capability?: RuntimeCapability;
  readonly description?: string;
  readonly id: string;
  readonly data?: Data;
}

export interface RuntimeBindingDescriptor<Value = unknown> {
  readonly actionId?: string;
  readonly id: string;
  readonly source: string;
  readonly target: string;
  readonly value?: Value;
}

export interface RuntimeAdapterDescriptor<Options = unknown> {
  readonly id: string;
  readonly kind: string;
  readonly options?: Options;
}

export interface RuntimeManifest {
  readonly actions: readonly RuntimeActionDescriptor[];
  readonly adapters: readonly RuntimeAdapterDescriptor[];
  readonly bindings: readonly RuntimeBindingDescriptor[];
  readonly config: RuntimeManifestConfig;
  readonly diagnostics: readonly RuntimeDiagnostic[];
  readonly kind: typeof RUNTIME_MANIFEST_KIND;
  readonly version: 1;
}

export interface RuntimeManifestInput {
  readonly actions?: readonly RuntimeActionDescriptor[];
  readonly adapters?: readonly RuntimeAdapterDescriptor[];
  readonly bindings?: readonly RuntimeBindingDescriptor[];
  readonly config: RuntimeManifestConfig;
  readonly diagnostics?: readonly RuntimeDiagnostic[];
}

export function defineRuntimeAction<Data = unknown>(
  action: RuntimeActionDescriptor<Data>,
): RuntimeActionDescriptor<Data> {
  return action;
}

export function defineRuntimeAdapter<Options = unknown>(
  adapter: RuntimeAdapterDescriptor<Options>,
): RuntimeAdapterDescriptor<Options> {
  return adapter;
}

export function defineRuntimeBinding<Value = unknown>(
  binding: RuntimeBindingDescriptor<Value>,
): RuntimeBindingDescriptor<Value> {
  return binding;
}

export function createRuntimeManifest(input: RuntimeManifestInput): RuntimeManifest {
  return {
    actions: input.actions ?? [],
    adapters: input.adapters ?? [],
    bindings: input.bindings ?? [],
    config: input.config,
    diagnostics: input.diagnostics ?? [],
    kind: RUNTIME_MANIFEST_KIND,
    version: 1,
  };
}

export function listRuntimeCapabilities(): readonly RuntimeCapability[] {
  return RUNTIME_CAPABILITIES;
}
