import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { expect, test } from 'bun:test';

test('the production build transforms JSX for browser consumers', () => {
  const buildConfig = JSON.parse(
    readFileSync(join(import.meta.dir, '..', 'tsconfig.build.json'), 'utf8'),
  ) as { readonly compilerOptions?: { readonly jsx?: unknown } };

  expect(buildConfig.compilerOptions?.jsx).toBe('react-jsx');
});
