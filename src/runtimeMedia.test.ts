import { describe, expect, it } from 'bun:test';
import type { MediaAsset } from '@ankhorage/contracts';

import {
  collectRuntimeMediaReferenceIds,
  createRuntimeMediaResolutionCache,
  createSyncRuntimeMediaResolutionMap,
  replaceRuntimeMediaReferences,
  resolveRuntimeMediaAsset,
} from './runtimeMedia';

const remoteImage: MediaAsset = {
  id: 'hero',
  name: 'Hero',
  kind: 'image',
  source: { kind: 'url', url: 'https://example.test/hero.png' },
};

const storedImage: MediaAsset = {
  id: 'stored',
  name: 'Stored',
  kind: 'image',
  source: { kind: 'storage', storageId: 'primary', bucket: 'media', path: 'hero.png' },
};

const bundledImage: MediaAsset = {
  id: 'bundled',
  name: 'Bundled',
  kind: 'image',
  source: { kind: 'bundled', path: 'assets/hero.png' },
};

describe('runtime media', () => {
  it('collects canonical media references recursively', () => {
    expect(
      collectRuntimeMediaReferenceIds({
        source: { mediaId: 'hero' },
        nested: [{ poster: { mediaId: 'stored' } }, { mediaId: 'hero' }],
      }),
    ).toEqual(['hero', 'stored']);
  });

  it('resolves stable URL media synchronously into component props', () => {
    const resolved = createSyncRuntimeMediaResolutionMap(['hero'], { hero: remoteImage });
    const props = replaceRuntimeMediaReferences(
      {
        source: { mediaId: 'hero' },
        missing: { mediaId: 'missing' },
      },
      resolved,
    );

    expect(props).toEqual({ source: 'https://example.test/hero.png' });
  });

  it('uses the host resolver for storage media and caches by asset and resolver', async () => {
    const cache = createRuntimeMediaResolutionCache();
    let calls = 0;
    const resolver = () => {
      calls += 1;
      return Promise.resolve('https://signed.example.test/hero.png');
    };

    const first = resolveRuntimeMediaAsset(storedImage, resolver, cache);
    const second = resolveRuntimeMediaAsset(storedImage, resolver, cache);

    expect(first).toBe(second);
    expect(await first).toBe('https://signed.example.test/hero.png');
    expect(calls).toBe(1);
  });

  it('delegates bundled media to the host without interpreting app-relative paths', async () => {
    const resolved = await resolveRuntimeMediaAsset(
      bundledImage,
      ({ asset }) => (asset.source.kind === 'bundled' ? 42 : null),
      createRuntimeMediaResolutionCache(),
    );

    expect(resolved).toBe(42);
  });

  it('does not reuse cached results when the host resolver changes', async () => {
    const cache = createRuntimeMediaResolutionCache();
    const firstResolver = () => 'https://one.example.test/hero.png';
    const secondResolver = () => 'https://two.example.test/hero.png';

    expect(await resolveRuntimeMediaAsset(storedImage, firstResolver, cache)).toBe(
      'https://one.example.test/hero.png',
    );
    expect(await resolveRuntimeMediaAsset(storedImage, secondResolver, cache)).toBe(
      'https://two.example.test/hero.png',
    );
  });

  it('normalizes host resolver failures to an unresolved media value', async () => {
    const value = await resolveRuntimeMediaAsset(
      storedImage,
      () => Promise.reject(new Error('provider unavailable')),
      createRuntimeMediaResolutionCache(),
    );

    expect(value).toBeNull();
  });

  it('leaves provider-backed media unresolved when no host resolver exists', async () => {
    const value = await resolveRuntimeMediaAsset(
      storedImage,
      undefined,
      createRuntimeMediaResolutionCache(),
    );

    expect(value).toBeNull();
  });
});
