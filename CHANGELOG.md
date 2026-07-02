# @ankhorage/runtime

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
