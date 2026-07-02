import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { createConfig } from '@ankhorage/devtools/eslint';

const configDir = path.dirname(fileURLToPath(import.meta.url));

export default createConfig({
  files: ['src/**/*.ts', 'tests/**/*.ts'],
  project: ['./tsconfig.eslint.json'],
  tsconfigRootDir: configDir,
});
