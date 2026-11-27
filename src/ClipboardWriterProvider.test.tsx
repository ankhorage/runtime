import { expect, test } from 'bun:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { ClipboardWriterProvider } from './ClipboardWriterProvider';
import { useClipboardWriter } from './useClipboardWriter';

function ClipboardWriterProbe() {
  return <output>{useClipboardWriter() === undefined ? 'unavailable' : 'available'}</output>;
}

test('exposes a host-supplied writer without selecting a platform implementation', () => {
  const markup = renderToStaticMarkup(
    <ClipboardWriterProvider writer={{ writeTextAsync: () => Promise.resolve('written') }}>
      <ClipboardWriterProbe />
    </ClipboardWriterProvider>,
  );

  expect(markup).toBe('<output>available</output>');
});

test('keeps clipboard access unavailable when the host has not supplied a writer', () => {
  expect(renderToStaticMarkup(<ClipboardWriterProbe />)).toBe('<output>unavailable</output>');
});
