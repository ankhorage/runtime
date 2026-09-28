import { defineParadoxConfig } from '@ankhorage/paradox';

export default defineParadoxConfig({
  mode: 'write',
  package: {
    entrypoints: ['src/index.ts'],
  },
  output: {
    dir: 'paradox',
  },
});
