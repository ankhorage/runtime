# Public API

## createRuntimeManifest

Kind: `function`
Module: `src/index.ts`
Source: `src/index.ts:81:1`

### Signatures

- `(input: RuntimeManifestInput) => RuntimeManifest`
  - input: `RuntimeManifestInput`
  - returns: `RuntimeManifest`

## defineRuntimeAction

Kind: `function`
Module: `src/index.ts`
Source: `src/index.ts:63:1`

### Signatures

- `(action: RuntimeActionDescriptor<Data>) => RuntimeActionDescriptor<Data>`
  - action: `RuntimeActionDescriptor<Data>`
  - returns: `RuntimeActionDescriptor<Data>`

## defineRuntimeAdapter

Kind: `function`
Module: `src/index.ts`
Source: `src/index.ts:69:1`

### Signatures

- `(adapter: RuntimeAdapterDescriptor<Options>) => RuntimeAdapterDescriptor<Options>`
  - adapter: `RuntimeAdapterDescriptor<Options>`
  - returns: `RuntimeAdapterDescriptor<Options>`

## defineRuntimeBinding

Kind: `function`
Module: `src/index.ts`
Source: `src/index.ts:75:1`

### Signatures

- `(binding: RuntimeBindingDescriptor<Value>) => RuntimeBindingDescriptor<Value>`
  - binding: `RuntimeBindingDescriptor<Value>`
  - returns: `RuntimeBindingDescriptor<Value>`

## listRuntimeCapabilities

Kind: `function`
Module: `src/index.ts`
Source: `src/index.ts:93:1`

### Signatures

- `() => readonly ("runtime.render" | "runtime.actions" | "runtime.bindings" | "runtime.adapters")[]`
  - returns: `readonly ("runtime.render" | "runtime.actions" | "runtime.bindings" | "runtime.adapters")[]`

## RUNTIME_CAPABILITIES

Kind: `value`
Module: `src/index.ts`
Source: `src/index.ts:1:14`

## RUNTIME_MANIFEST_KIND

Kind: `value`
Module: `src/index.ts`
Source: `src/index.ts:8:14`

## RuntimeActionDescriptor

Kind: `type`
Module: `src/index.ts`
Source: `src/index.ts:24:1`

### Members

| Name        | Kind     | Type                                                                                             | Required | Description |
| ----------- | -------- | ------------------------------------------------------------------------------------------------ | -------- | ----------- |
| capability  | property | `"runtime.render" \| "runtime.actions" \| "runtime.bindings" \| "runtime.adapters" \| undefined` | no       |             |
| data        | property | `Data \| undefined`                                                                              | no       |             |
| description | property | `string \| undefined`                                                                            | no       |             |
| id          | property | `string`                                                                                         | yes      |             |

## RuntimeAdapterDescriptor

Kind: `type`
Module: `src/index.ts`
Source: `src/index.ts:39:1`

### Members

| Name    | Kind     | Type                   | Required | Description |
| ------- | -------- | ---------------------- | -------- | ----------- |
| id      | property | `string`               | yes      |             |
| kind    | property | `string`               | yes      |             |
| options | property | `Options \| undefined` | no       |             |

## RuntimeBindingDescriptor

Kind: `type`
Module: `src/index.ts`
Source: `src/index.ts:31:1`

### Members

| Name     | Kind     | Type                  | Required | Description |
| -------- | -------- | --------------------- | -------- | ----------- |
| actionId | property | `string \| undefined` | no       |             |
| id       | property | `string`              | yes      |             |
| source   | property | `string`              | yes      |             |
| target   | property | `string`              | yes      |             |
| value    | property | `Value \| undefined`  | no       |             |

## RuntimeCapability

Kind: `unknown`
Module: `src/index.ts`
Source: `src/index.ts:10:1`

## RuntimeConfig

Kind: `type`
Module: `src/index.ts`
Source: `src/index.ts:18:1`

### Members

| Name        | Kind     | Type                                             | Required | Description |
| ----------- | -------- | ------------------------------------------------ | -------- | ----------- |
| appId       | property | `string`                                         | yes      |             |
| environment | property | `string \| undefined`                            | no       |             |
| values      | property | `Readonly<Record<string, unknown>> \| undefined` | no       |             |

## RuntimeDiagnostic

Kind: `type`
Module: `src/index.ts`
Source: `src/index.ts:12:1`

### Members

| Name     | Kind     | Type                             | Required | Description |
| -------- | -------- | -------------------------------- | -------- | ----------- |
| code     | property | `string`                         | yes      |             |
| message  | property | `string`                         | yes      |             |
| severity | property | `"error" \| "info" \| "warning"` | yes      |             |

## RuntimeManifest

Kind: `type`
Module: `src/index.ts`
Source: `src/index.ts:45:1`

### Members

| Name        | Kind     | Type                                           | Required | Description |
| ----------- | -------- | ---------------------------------------------- | -------- | ----------- |
| actions     | property | `readonly RuntimeActionDescriptor<unknown>[]`  | yes      |             |
| adapters    | property | `readonly RuntimeAdapterDescriptor<unknown>[]` | yes      |             |
| bindings    | property | `readonly RuntimeBindingDescriptor<unknown>[]` | yes      |             |
| config      | property | `RuntimeConfig`                                | yes      |             |
| diagnostics | property | `readonly RuntimeDiagnostic[]`                 | yes      |             |
| kind        | property | `"ankhorage-runtime-manifest"`                 | yes      |             |
| version     | property | `1`                                            | yes      |             |

## RuntimeManifestInput

Kind: `type`
Module: `src/index.ts`
Source: `src/index.ts:55:1`

### Members

| Name        | Kind     | Type                                                        | Required | Description |
| ----------- | -------- | ----------------------------------------------------------- | -------- | ----------- |
| actions     | property | `readonly RuntimeActionDescriptor<unknown>[] \| undefined`  | no       |             |
| adapters    | property | `readonly RuntimeAdapterDescriptor<unknown>[] \| undefined` | no       |             |
| bindings    | property | `readonly RuntimeBindingDescriptor<unknown>[] \| undefined` | no       |             |
| config      | property | `RuntimeConfig`                                             | yes      |             |
| diagnostics | property | `readonly RuntimeDiagnostic[] \| undefined`                 | no       |             |
