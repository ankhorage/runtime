import type { ClipboardWriter, ClipboardWriteResult } from './types/clipboard.js';

/*** Requests a host clipboard write while converting missing and rejected host access into explicit outcomes. */
export async function writeClipboardTextAsync(
  writer: ClipboardWriter | undefined,
  text: string,
): Promise<ClipboardWriteResult> {
  if (writer === undefined) return 'unavailable';

  try {
    return await writer.writeTextAsync(text);
  } catch {
    return 'denied';
  }
}
