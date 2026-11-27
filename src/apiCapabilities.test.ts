import { expect, it } from 'bun:test';

import type { RuntimeApiCapabilityExecutorOptions } from './apiCapabilities';
import { createRuntimeApiCapabilityExecutor } from './apiCapabilities';

it('exposes the API executor through the server-safe public facade', () => {
  const acceptsOptions = (_options: RuntimeApiCapabilityExecutorOptions): void => {
    void _options;
  };

  expect(createRuntimeApiCapabilityExecutor).toBeFunction();
  expect(acceptsOptions).toBeFunction();
});
