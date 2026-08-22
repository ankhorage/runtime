import type { AppManifest } from '@ankhorage/contracts';
import { describe, expect, it } from 'bun:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import {
  ManifestProvider,
  useManifestContext,
  useOptionalManifestContext,
} from './ManifestContext';
import { RuntimeRendererConfigProvider, useRuntimeRendererConfig } from './RuntimeRendererConfig';

const manifest = {
  metadata: {
    name: 'React 19 fixture',
    slug: 'react-19-fixture',
    version: '1.0.0',
    category: 'developer_tools',
    themeId: 'default',
  },
  themes: [],
  activeThemeId: 'default',
  infra: { modules: [] },
  navigator: { type: 'stack', routes: [] },
  screens: {},
  settings: { localization: { defaultLocale: 'en', locales: ['en'] } },
} satisfies AppManifest;

function ManifestProbe() {
  const context = useManifestContext();
  return <output>{`${context.manifest.metadata.slug}:${context.activeScreenId}`}</output>;
}

function RendererConfigProbe() {
  const config = useRuntimeRendererConfig();
  return <output>{config.disableActions ? 'disabled' : 'enabled'}</output>;
}

function OptionalManifestProbe() {
  return <output>{useOptionalManifestContext() === null ? 'absent' : 'present'}</output>;
}

describe('React 19.2 context behavior', () => {
  it('renders the manifest through React 19 context syntax and use()', () => {
    const markup = renderToStaticMarkup(
      <ManifestProvider manifest={manifest} activeScreenId="home">
        <ManifestProbe />
      </ManifestProvider>,
    );

    expect(markup).toBe('<output>react-19-fixture:home</output>');
  });

  it('composes nested renderer configuration providers', () => {
    const markup = renderToStaticMarkup(
      <RuntimeRendererConfigProvider value={{ disableActions: true }}>
        <RuntimeRendererConfigProvider value={{ disableActions: false }}>
          <RendererConfigProbe />
        </RuntimeRendererConfigProvider>
      </RuntimeRendererConfigProvider>,
    );

    expect(markup).toBe('<output>disabled</output>');
  });

  it('keeps optional manifest reads nullable without a provider', () => {
    expect(renderToStaticMarkup(<OptionalManifestProbe />)).toBe('<output>absent</output>');
  });
});
