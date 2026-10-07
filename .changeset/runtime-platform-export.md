---
'@ankhorage/runtime': patch
---

Mark the renderer root export as React Native/browser-specific so standalone release verification continues to smoke-test only the headless Runtime entrypoints under Node/Bun.
