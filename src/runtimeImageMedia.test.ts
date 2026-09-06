import { expect, test } from 'bun:test';

import { collectRuntimeMediaReferenceIds, replaceRuntimeMediaReferences } from './runtimeMedia';
import { resolveRuntimeNodeProps } from './runtimeNodeProps';

test('retains Image and Icon media references until the shared media resolver supplies a bundled source', () => {
  for (const type of ['Image', 'Icon']) {
    const node = { id: 'artwork', type, props: { source: { mediaId: 'artwork' } } };
    const props = resolveRuntimeNodeProps({ node });
    expect(collectRuntimeMediaReferenceIds(props)).toEqual(['artwork']);
    expect(replaceRuntimeMediaReferences(props, new Map([['artwork', 42]]))).toEqual({
      testID: 'artwork',
      source: 42,
    });
    expect(node.props.source).toEqual({ mediaId: 'artwork' });
  }
});
