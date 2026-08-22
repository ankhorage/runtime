import type { UiNode } from '@ankhorage/contracts';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Text, View } from 'react-native';

import { RuntimeRenderer } from '../src/RuntimeRenderer';

const webNode: UiNode = {
  id: 'web-root',
  type: 'Box',
  props: {
    accessibilityLabel: 'Runtime Web root',
  },
  children: [
    {
      id: 'web-label',
      type: 'Label',
      props: { children: 'React Native Web 0.21' },
    },
  ],
};

export function renderReactNativeWebRuntimeFixture(): string {
  return renderToStaticMarkup(
    <RuntimeRenderer
      node={webNode}
      isRoot
      registry={{
        Box: View,
        Label: Text,
      }}
    />,
  );
}
