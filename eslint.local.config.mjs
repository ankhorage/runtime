import { createConfig } from '@ankhorage/devtools/eslint';

export default [
  ...createConfig({
    files: ['tests/**/*.{ts,tsx}'],
    project: ['./tsconfig.eslint.json'],
    tsconfigRootDir: import.meta.dirname,
  }),
  {
    // Devtools 1.6 exposes pre-existing function-size debt outside the Expo 57 migration.
    files: [
      'src/RuntimeRenderer.tsx',
      'src/RuntimeRendererConfig.test.tsx',
      'src/rendering.test.ts',
      'src/runtimeActionRegistry.actions.test.ts',
      'src/runtimeActionRegistry.chains.test.ts',
      'src/runtimeActionRegistry.operations.test.ts',
      'src/runtimeActionRegistry.ts',
      'src/runtimeApiOperations.test.ts',
      'src/runtimeBindings.test.ts',
      'src/runtimeDbPersist.test.ts',
      'src/runtimeEventExecution.test.ts',
      'src/runtimeMedia.test.ts',
      'src/runtimeNodeProps.test.ts',
      'src/runtimeNodeProps.ts',
      'src/runtimeRepeat.test.ts',
      'src/runtimeRepeat.ts',
      'src/runtimeScreenLoaders.execution.test.ts',
      'src/runtimeScreenLoaders.lifecycle.test.ts',
      'src/runtimeScreenLoaders.ts',
      'src/runtimeStateAdapter.ts',
      'tests/runtime.test.ts',
    ],
    rules: {
      'max-lines-per-function': 'off',
    },
  },
  {
    // These files already exceeded the current shared file-size limit before this migration.
    files: [
      'src/RuntimeRenderer.tsx',
      'src/runtimeActionRegistry.ts',
      'src/runtimeBindings.test.ts',
      'src/runtimeBindings.ts',
      'src/runtimeScreenLoaders.ts',
    ],
    rules: {
      'max-lines': 'off',
    },
  },
  {
    // Existing branching is retained until dedicated renderer/action decomposition work.
    files: [
      'src/RuntimeRenderer.tsx',
      'src/RuntimeRendererConfig.tsx',
      'src/runtimeActionRegistry.ts',
    ],
    rules: {
      complexity: 'off',
    },
  },
  {
    // Devtools 1.6 newly flags pre-existing dynamic manifest record indexing; remediation needs a dedicated data-structure audit.
    files: [
      'src/runtimeActionRegistry.operations.test.ts',
      'src/runtimeActionRegistry.ts',
      'src/runtimeBindings.test.ts',
      'src/runtimeBindings.ts',
      'src/runtimeMedia.ts',
      'src/runtimeNodeProps.ts',
      'src/runtimeRepeat.test.ts',
      'src/runtimeRepeat.ts',
      'src/runtimeScreenLoaders.ts',
      'src/runtimeStateAdapter.ts',
      'src/runtimeStateAdapterConfig.test.ts',
      'src/useRuntimeMediaProps.ts',
    ],
    rules: {
      'security/detect-object-injection': 'off',
    },
  },
];
