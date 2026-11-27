import { use } from 'react';

import { ClipboardWriterContext } from './ClipboardWriterContext.js';
import type { ClipboardWriter } from './types/clipboard.js';

/*** Reads an optional host clipboard writer so components can report unavailable access without a local fallback. */
export function useClipboardWriter(): ClipboardWriter | undefined {
  return use(ClipboardWriterContext);
}
