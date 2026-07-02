---
'@ankhorage/runtime': minor
---

Expand `@ankhorage/runtime` from bootstrap contracts into the extracted generic
runtime package. The package now owns the shared renderer, bindings, action
registry, screen loaders, and state-adapter helpers while keeping framework
integration injected through `executeAction` instead of importing `expo-router`
or Zora hooks directly.
