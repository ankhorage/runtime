# @ankhorage/runtime

## 2.0.0

### Major Changes

- be91179: Resolve operation bindings through canonical `infra.apis[]` API identities, delegate API execution to `@ankhorage/data-sources`, and remove the API-to-database operation shortcut while preserving explicit database actions separately.

## 1.1.0

### Minor Changes

- e898519: Resolve canonical `{ mediaId }` component-property references through the app media registry. External URLs resolve immediately, while storage and bundled assets use a provider-neutral host resolver with cached async resolution and safe unresolved fallbacks.

## 1.0.0

### Major Changes

- 3e09665: Consume the canonical Contracts 4 and Data Sources 1 API taxonomy, remove the obsolete `manifest.data.apis` seed-loader surface, and execute database-backed generated API operations through their referenced runtime database adapters.

## 0.3.0

### Minor Changes

- 290ca3a: Remove Runtime-owned concrete and app-extension component registry exports so hosts inject all component registries explicitly.

## 0.2.4

### Patch Changes

- 81fe6a0: Remove Runtime-owned ZORA component registry exports and require hosts to inject concrete component registries.

## 0.2.3

### Patch Changes

- 053bfe1: update ZORA

## 0.2.2

### Patch Changes

- c1315d1: Update package command metadata.

## 0.2.1

### Patch Changes

- 21fd6e9: Consume and re-export shared runtime callback contracts from `@ankhorage/contracts/runtime`.

## 0.2.0

### Minor Changes

- ae57bd5: Expand `@ankhorage/runtime` from bootstrap contracts into the extracted generic
  runtime package. The package now owns the shared renderer, bindings, action
  registry, screen loaders, and state-adapter helpers while keeping framework
  integration injected through `executeAction` instead of importing `expo-router`
  or Zora hooks directly.

## 0.1.1

### Patch Changes

- 0813996: Trigger release

## 0.1.0

### Minor Changes

- a13f394: Bootstrap the standalone platform-neutral runtime package.

## 0.0.0

- Bootstrap package placeholder.
