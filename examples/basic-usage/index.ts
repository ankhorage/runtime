import { createRuntimeManifest } from '../../src/runtimeManifest.js';

/***
 * @title Basic Usage
 *
 * `@ankhorage/runtime` owns platform-neutral runtime renderer contracts for generated apps.
 *
 * Host apps keep router, theme, and other framework-specific behavior outside this package and
 * inject it at the runtime boundary.
 *
 * @usage
 * @readme
 */
createRuntimeManifest({
  config: {
    appId: 'demo',
  },
});
