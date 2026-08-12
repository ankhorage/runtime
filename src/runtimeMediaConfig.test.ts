import type { MediaAssetRegistry } from '@ankhorage/contracts';
import { describe, expect, it } from 'bun:test';

import { mergeRuntimeRendererConfig } from './RuntimeRendererConfig';

const inheritedAssets: MediaAssetRegistry = {
  inherited: {
    id: 'inherited',
    name: 'Inherited',
    kind: 'image',
    source: { kind: 'url', url: 'https://example.test/inherited.png' },
  },
};

const localAssets: MediaAssetRegistry = {
  local: {
    id: 'local',
    name: 'Local',
    kind: 'image',
    source: { kind: 'url', url: 'https://example.test/local.png' },
  },
};

describe('runtime media config', () => {
  it('inherits media assets and resolver when no local override exists', () => {
    const resolver = () => 'https://example.test/resolved.png';
    const merged = mergeRuntimeRendererConfig(
      {},
      {
        mediaAssets: inheritedAssets,
        resolveMediaAsset: resolver,
      },
    );

    expect(merged.mediaAssets).toBe(inheritedAssets);
    expect(merged.resolveMediaAsset).toBe(resolver);
  });

  it('prefers local media assets and resolver as one app-runtime boundary', () => {
    const inheritedResolver = () => 'https://example.test/inherited.png';
    const localResolver = () => 'https://example.test/local.png';
    const merged = mergeRuntimeRendererConfig(
      { mediaAssets: localAssets, resolveMediaAsset: localResolver },
      { mediaAssets: inheritedAssets, resolveMediaAsset: inheritedResolver },
    );

    expect(merged.mediaAssets).toBe(localAssets);
    expect(merged.resolveMediaAsset).toBe(localResolver);
  });
});
