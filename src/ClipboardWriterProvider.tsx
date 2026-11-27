import React from 'react';

import { ClipboardWriterContext } from './ClipboardWriterContext.js';
import type { ClipboardWriter } from './types/clipboard.js';

/*** Supplies the host-owned clipboard writer without selecting a browser or native implementation. */
export function ClipboardWriterProvider(props: {
  readonly children: React.ReactNode;
  readonly writer: ClipboardWriter;
}) {
  return <ClipboardWriterContext value={props.writer}>{props.children}</ClipboardWriterContext>;
}
