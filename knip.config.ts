import { createKnipConfig } from '@ankhorage/devtools/knip';

export default createKnipConfig({
  entry: ['src/index.ts', 'src/bindings.ts'],
  ignoreFiles: [
    'eslint.config.mjs',
    'paradox.config.ts',
    'prettier.config.cjs',
    'src/readme-usage.ts',
  ],
});
