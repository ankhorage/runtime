import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { ZORA_COMPONENT_META } from '@ankhorage/zora/metadata';
import { describe, expect, it } from 'bun:test';
import React from 'react';

import { type ComponentRegistry, createComponentRegistry } from './componentRegistry';

const registrySource = readFileSync(join(import.meta.dir, 'registry.tsx'), 'utf8');

function BaseComponent() {
  return React.createElement('BaseComponent');
}

function ExtensionComponent() {
  return React.createElement('ExtensionComponent');
}

function getDirectZoraManifestNodeNames(): string[] {
  return Object.entries(ZORA_COMPONENT_META)
    .filter(([, meta]) => meta.directManifestNode)
    .map(([name]) => name)
    .sort();
}

describe('runtime component registry', () => {
  it('routes every direct ZORA manifest node through the runtime registry', () => {
    for (const nodeType of getDirectZoraManifestNodeNames()) {
      expect(registrySource).toContain(`| '${nodeType}'`);
      expect(registrySource).toContain(`${nodeType}: zora.${nodeType}`);
    }
  });

  it('registers ZORA scanner components used by generated scanner templates', () => {
    expect(registrySource).toContain("| 'BarcodeScannerView'");
    expect(registrySource).toContain("| 'CameraPermissionView'");
    expect(registrySource).toContain("| 'ScanOverlay'");
    expect(registrySource).toContain('BarcodeScannerView: zora.BarcodeScannerView');
    expect(registrySource).toContain('CameraPermissionView: zora.CameraPermissionView');
    expect(registrySource).toContain('ScanOverlay: zora.ScanOverlay');
    expect(registrySource).toContain("| 'DisclosureSection'");
    expect(registrySource).toContain('DisclosureSection: zora.DisclosureSection');
  });

  it('routes app-facing navigation chrome through ZORA', () => {
    expect(registrySource).toMatch(/ZoraDrawerContent: zora\.ZoraDrawerContent/);
    expect(registrySource).toMatch(/ZoraTabBar: zora\.ZoraTabBar/);
  });

  it('registers OAuth provider components used by generated auth screens', () => {
    expect(registrySource).toContain("| 'OAuthProviderButton'");
    expect(registrySource).toContain("| 'OAuthProviderList'");
    expect(registrySource).toContain('OAuthProviderButton: zora.OAuthProviderButton');
    expect(registrySource).toContain('OAuthProviderList: zora.OAuthProviderList');
  });

  it('composes app extension registry entries after core entries', () => {
    expect(registrySource).toContain(
      "import { APP_EXTENSION_COMPONENT_REGISTRY } from './appExtensionRegistry';",
    );
    expect(registrySource).toContain('APP_EXTENSION_COMPONENT_REGISTRY');

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

  it('does not keep app-facing Heading ownership in the Surface registry', () => {
    expect(registrySource).toMatch(
      /export const SURFACE_COMPONENT_REGISTRY: ComponentRegistry = \{\}/,
    );
    expect(registrySource).not.toMatch(/from '@ankhorage\/surface'/);
  });
});
