import { describe, expect, it } from 'bun:test';
import React from 'react';

import {
  APP_EXTENSION_COMPONENT_REGISTRY,
  type ComponentRegistry,
  createComponentRegistry,
} from './registry';

function BaseComponent() {
  return React.createElement('BaseComponent');
}

function ExtensionComponent() {
  return React.createElement('ExtensionComponent');
}

describe('runtime component registry', () => {
  it('exports an empty app extension registry by default', () => {
    expect(APP_EXTENSION_COMPONENT_REGISTRY).toEqual({});
  });

  it('composes injected app registry entries after base registry entries', () => {
    const baseRegistry = {
      Shared: BaseComponent,
    } satisfies ComponentRegistry;
    const extensionRegistry = {
      Shared: ExtensionComponent,
      ExtensionOnly: ExtensionComponent,
    } satisfies ComponentRegistry;

    const registry = createComponentRegistry(baseRegistry, extensionRegistry);

    expect(registry.Shared).toBe(ExtensionComponent);
    expect(registry.ExtensionOnly).toBe(ExtensionComponent);
  });

  it('accepts readonly registries for immutable host-owned registries', () => {
    const readonlyRegistry: ComponentRegistry = Object.freeze({
      Base: BaseComponent,
    });

    const registry = createComponentRegistry(readonlyRegistry, {
      Extension: ExtensionComponent,
    });

    expect(registry.Base).toBe(BaseComponent);
    expect(registry.Extension).toBe(ExtensionComponent);
  });
});
