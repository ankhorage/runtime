import { createContext } from 'react';

import type { ClipboardWriter } from './types/clipboard.js';

export const ClipboardWriterContext = createContext<ClipboardWriter | undefined>(undefined);
