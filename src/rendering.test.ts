import { describe, expect, it } from 'bun:test';
import React from 'react';

import type { ComponentRegistry } from './registry';
import {
  getUnknownComponentDiagnostic,
  resolveRenderedChildren,
  resolveRuntimeRegistry,
} from './rendering';

type ReactNativeDevGlobal = typeof globalThis & {
  __DEV__?: boolean;
};

(globalThis as ReactNativeDevGlobal).__DEV__ = false;

interface FixtureProps {
  children?: React.ReactNode;
}

const BoxFixture = ({ children }: FixtureProps): React.ReactElement =>
  React.createElement(React.Fragment, null, children);

const PageFixture = ({ children }: FixtureProps): React.ReactElement =>
  React.createElement(React.Fragment, null, children);

const StackFixture = ({ children }: FixtureProps): React.ReactElement =>
  React.createElement(React.Fragment, null, children);

describe('runtime rendering helpers', () => {
  it('prefers explicit prop registries over config registries', () => {
    const zoraLikeRegistry = {
      Box: BoxFixture,
      Page: PageFixture,
    } satisfies ComponentRegistry;
    const resolvedRegistry = resolveRuntimeRegistry({
      propRegistry: zoraLikeRegistry,
      configRegistry: { Stack: StackFixture },
    });

    expect(resolvedRegistry.Page).toBeDefined();
    expect(resolvedRegistry.Box).toBeDefined();
    expect(resolvedRegistry.Stack).toBeUndefined();
  });

  it('preserves Text entries supplied through an explicit registry', () => {
    const TextFixture = ({ children }: FixtureProps): React.ReactElement =>
      React.createElement(React.Fragment, null, children);

    const textRegistry = {
      Text: TextFixture,
    } satisfies ComponentRegistry;

    const resolvedRegistry = resolveRuntimeRegistry({
      propRegistry: textRegistry,
      configRegistry: undefined,
    });

    expect(resolvedRegistry.Text).toBe(TextFixture);
  });

  it('uses config registries when no prop registry is supplied', () => {
    const configRegistry = {
      Stack: StackFixture,
    } satisfies ComponentRegistry;

    const resolvedRegistry = resolveRuntimeRegistry({
      configRegistry,
      propRegistry: undefined,
    });

    expect(resolvedRegistry.Stack).toBe(StackFixture);
  });

  it('does not provide a concrete component fallback registry', () => {
    const resolvedRegistry = resolveRuntimeRegistry({
      configRegistry: undefined,
      propRegistry: undefined,
    });

    expect(resolvedRegistry.Box).toBeUndefined();
    expect(Object.keys(resolvedRegistry)).toEqual([]);
  });

  it('preserves prop children when manifests encode content in props', () => {
    const rendered = resolveRenderedChildren({
      propChildren: 'Continue',
      renderedChildren: undefined,
    });

    expect(rendered).toBe('Continue');

    const nested = [React.createElement('span', { key: 'child' }, 'Nested')];
    expect(
      resolveRenderedChildren({
        propChildren: 'Continue',
        renderedChildren: nested,
      }),
    ).toBe(nested);
  });

  it('produces actionable unknown-node diagnostics', () => {
    const diagnostic = getUnknownComponentDiagnostic('Page', {
      Box: BoxFixture,
      Stack: StackFixture,
    });

    expect(diagnostic.title).toContain('Page');
    expect(diagnostic.detail).toContain('Box');
    expect(diagnostic.suggestion).toContain('registry');
    expect(diagnostic.suggestion).toContain('inject');
  });
});
