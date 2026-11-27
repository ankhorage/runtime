/** The explicit outcomes a trusted host reports after a clipboard write request. */
export type ClipboardWriteResult = 'denied' | 'unavailable' | 'written';

/** A host-owned boundary for writing plain text without exposing platform APIs to consumers. */
export interface ClipboardWriter {
  writeTextAsync: (text: string) => Promise<ClipboardWriteResult>;
}
