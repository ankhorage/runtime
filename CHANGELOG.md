# @ankhorage/runtime

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
