import { createRuntimeManifest } from './index.js';

/***
 * Framework-neutral runtime boundary
 *
 * `@ankhorage/runtime` owns platform-neutral runtime renderer contracts for generated apps.
 *
 * Host apps keep router, theme, and other framework-specific behavior outside this package and
 * inject it at the runtime boundary.
 *
 * @usage
 */
createRuntimeManifest({
  config: {
    appId: 'demo',
  },
});
