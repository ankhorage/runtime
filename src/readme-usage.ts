import { createRuntimeManifest } from './index.js';

/***
 * Generic runtime boundary
 *
 * `@ankhorage/runtime` owns platform-neutral runtime contracts for generated apps.
 *
 * This first package slice is intentionally metadata-only plus public contracts so
 * `ankhorage4#430` can move real runtime implementation into a stable target.
 *
 * @usage
 */
createRuntimeManifest({
  config: {
    appId: 'demo',
  },
});
