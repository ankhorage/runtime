import { expect, test } from 'bun:test';

import { writeClipboardTextAsync } from './writeClipboardTextAsync';

test('returns unavailable without a host writer', async () => {
  expect(await writeClipboardTextAsync(undefined, '#2563eb')).toBe('unavailable');
});

test('returns the explicit host outcome', async () => {
  expect(
    await writeClipboardTextAsync({ writeTextAsync: () => Promise.resolve('written') }, '#2563eb'),
  ).toBe('written');
});

test('converts a rejected host write into denied feedback', async () => {
  expect(
    await writeClipboardTextAsync(
      { writeTextAsync: () => Promise.reject(new Error('clipboard denied')) },
      '#2563eb',
    ),
  ).toBe('denied');
});
