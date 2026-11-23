import type { ComponentDataBindingRegistry, UiNode } from '@ankhorage/contracts';
import { expect, it, mock } from 'bun:test';
import React from 'react';
import { act, create } from 'react-test-renderer';

import type { ComponentRegistry } from './registry.js';
import {
  resolveRuntimeBindingExpressionSync,
  type RuntimeCapabilityExecutionResult,
} from './runtimeBindings.js';

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

void mock.module('react-native', () => ({
  StyleSheet: { create: <TStyles,>(styles: TStyles): TStyles => styles },
  Text: 'text',
  View: 'view',
}));

const { RuntimeRenderer } = await import('./RuntimeRenderer.js');

let submitSearch: (() => void) | undefined;

type PendingCapabilityResult = (result: RuntimeCapabilityExecutionResult) => void;

const SearchButton = ({ onPress }: { readonly onPress?: () => void }): React.ReactElement => {
  submitSearch = onPress;
  return <button onClick={onPress}>Search</button>;
};

const DataTableProbe = ({
  errorMessage,
  rows,
  status,
}: {
  readonly errorMessage?: unknown;
  readonly rows?: unknown;
  readonly status?: unknown;
}): React.ReactElement => (
  <output
    data-error-message={String(errorMessage)}
    data-rows={JSON.stringify(rows)}
    data-status={String(status)}
  />
);

const registry: ComponentRegistry = { DataTableProbe, SearchButton, View: 'div' };

const node = {
  children: [
    { id: 'search', type: 'SearchButton' },
    { id: 'companies', type: 'DataTableProbe' },
  ],
  id: 'root',
  type: 'View',
} satisfies UiNode;

const dataBindings = {
  companies: {
    componentId: 'companies',
    props: {
      errorMessage: { value: { capability: 'runtime.eventOperation', path: 'errorMessage' } },
      rows: {
        value: {
          fallback: { kind: 'literal', value: [] },
          kind: 'fallback',
          value: {
            capability: 'api.companies.search',
            path: 'companies',
            result: 'company-search',
          },
        },
      },
      status: { value: { capability: 'runtime.eventOperation', path: 'status' } },
    },
  },
  search: {
    componentId: 'search',
    events: {
      press: [{ target: { capability: 'api.companies.search', result: 'company-search' } }],
    },
  },
} satisfies ComponentDataBindingRegistry;

it('projects structured result fields and direct arrays without evaluating a missing field', () => {
  const context = {
    resultSlots: {
      direct: [{ id: 'company-1' }],
      envelope: { companies: [{ id: 'company-2' }] },
    },
  };

  expect(
    resolveRuntimeBindingExpressionSync(
      { capability: 'api.companies.search', path: 'companies', result: 'envelope' },
      context,
    ),
  ).toEqual([{ id: 'company-2' }]);
  expect(
    resolveRuntimeBindingExpressionSync(
      { capability: 'api.companies.search', path: '0.id', result: 'direct' },
      context,
    ),
  ).toBe('company-1');
  expect(
    resolveRuntimeBindingExpressionSync(
      {
        fallback: { kind: 'literal', value: [] },
        kind: 'fallback',
        value: { capability: 'api.companies.search', path: 'missing', result: 'envelope' },
      },
      context,
    ),
  ).toEqual([]);
});

async function mountGeneratedSearch(args: {
  readonly diagnostics: unknown[];
  readonly pending: PendingCapabilityResult[];
}): Promise<{ readonly renderer: ReturnType<typeof create>; readonly submit: () => void }> {
  const executeCapability = () =>
    new Promise<RuntimeCapabilityExecutionResult>((resolve) => {
      args.pending.push(resolve);
    });
  let renderer: ReturnType<typeof create> | undefined;

  await act(async () => {
    renderer = create(
      <RuntimeRenderer
        dataBindings={dataBindings}
        executeCapability={executeCapability}
        isRoot
        node={node}
        onDiagnostics={(reported) => args.diagnostics.push(...reported)}
        registry={registry}
      />,
    );
    await Promise.resolve();
  });
  if (renderer === undefined || submitSearch === undefined)
    throw new Error('Expected a mounted generated search control.');
  return { renderer, submit: submitSearch };
}

async function startGeneratedSearch(submit: () => void): Promise<void> {
  await act(async () => {
    submit();
    await Promise.resolve();
  });
}

async function settleGeneratedSearch(
  pending: PendingCapabilityResult[],
  result: RuntimeCapabilityExecutionResult,
): Promise<void> {
  const resolve = pending.shift();
  if (resolve === undefined) throw new Error('Expected one pending generated search.');
  await act(async () => {
    resolve(result);
    await Promise.resolve();
  });
}

function dataTableProps(renderer: ReturnType<typeof create>): Record<string, unknown> {
  const { props } = renderer.root.findByType('output');
  return props;
}

it('drives a generated DataTable from a projected result slot and clears stale rows safely', async () => {
  const pending: PendingCapabilityResult[] = [];
  const diagnostics: unknown[] = [];
  const { renderer, submit } = await mountGeneratedSearch({ diagnostics, pending });

  expect(dataTableProps(renderer)).toMatchObject({
    'data-rows': '[]',
    'data-status': 'idle',
  });

  await startGeneratedSearch(submit);
  expect(dataTableProps(renderer)).toMatchObject({
    'data-rows': '[]',
    'data-status': 'loading',
  });

  await settleGeneratedSearch(pending, {
    data: { companies: [{ name: 'Ankhorage AG', uid: 'CHE-1' }] },
    ok: true,
  });
  expect(dataTableProps(renderer)).toMatchObject({
    'data-rows': '[{"name":"Ankhorage AG","uid":"CHE-1"}]',
    'data-status': 'success',
  });

  await startGeneratedSearch(submit);
  expect(dataTableProps(renderer)['data-rows']).toBe('[]');

  const secret = 'Bearer server-only-secret';
  await settleGeneratedSearch(pending, {
    diagnostics: [
      { code: 'upstream-error', message: `Authorization: ${secret}`, severity: 'error' },
    ],
    ok: false,
  });
  const props = dataTableProps(renderer);
  expect(props).toMatchObject({
    'data-error-message': 'The operation could not be completed. Please try again.',
    'data-rows': '[]',
    'data-status': 'error',
  });
  expect(JSON.stringify({ diagnostics, props })).not.toContain(secret);
});
