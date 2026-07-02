import { describe, expect, it } from 'bun:test';
import React from 'react';

import {
  composeRuntimeNodePropsResolver,
  composeRuntimeRendererWrapNode,
  mergeRuntimeRendererConfig,
} from './RuntimeRendererConfig';

describe('RuntimeRendererConfig', () => {
  it('merges disableActions with sticky inheritance and applies inherited wrapping last', () => {
    const calls: string[] = [];
    const explicitWrap = ({
      node,
      rendered,
    }: {
      node: { id: string };
      rendered: React.ReactNode;
    }) => {
      calls.push(`explicit:${node.id}`);
      return <section data-node-id={node.id}>{rendered}</section>;
    };
    const inheritedWrap = ({
      node,
      rendered,
    }: {
      node: { id: string };
      rendered: React.ReactNode;
    }) => {
      calls.push(`inherited:${node.id}`);
      return <article data-node-id={node.id}>{rendered}</article>;
    };

    const merged = mergeRuntimeRendererConfig(
      { disableActions: false, wrapNode: explicitWrap },
      { disableActions: true, wrapNode: inheritedWrap },
    );

    expect(merged.disableActions).toBe(true);
    expect(merged.registry).toBeUndefined();
    expect(composeRuntimeRendererWrapNode(explicitWrap, inheritedWrap)).toBeDefined();
    const { wrapNode } = merged;
    expect(wrapNode).toBeDefined();

    const wrappedElement = wrapNode?.({
      isRoot: false,
      node: { id: 'node-1', type: 'Box' },
      rendered: <div>leaf</div>,
    });
    expect(React.isValidElement(wrappedElement)).toBe(true);

    const outerElement = wrappedElement as React.ReactElement<{ children: React.ReactNode }>;
    const innerElement = outerElement.props.children as React.ReactElement;

    expect(calls).toEqual(['explicit:node-1', 'inherited:node-1']);
    expect(outerElement.type).toBe('article');
    expect(React.isValidElement(innerElement)).toBe(true);
    expect(innerElement.type).toBe('section');
  });

  it('preserves inherited config when no local override is provided', () => {
    const inheritedWrap = ({ rendered }: { rendered: React.ReactNode }) => rendered;

    const merged = mergeRuntimeRendererConfig(
      {},
      { disableActions: true, wrapNode: inheritedWrap },
    );

    expect(merged.disableActions).toBe(true);
    expect(merged.registry).toBeUndefined();
    expect(merged.wrapNode).toBe(inheritedWrap);
  });

  it('composes inherited node prop resolvers before local overrides', () => {
    const calls: string[] = [];
    const baseProps = { text: 'base', tone: 'muted' };
    const inheritedResolver = ({ props }: { props: Record<string, unknown> }) => {
      calls.push('inherited');
      return { ...props, text: 'inherited', inherited: true };
    };
    const localResolver = ({ props }: { props: Record<string, unknown> }) => {
      calls.push('local');
      return { ...props, text: 'local', local: true };
    };

    const composedResolver = composeRuntimeNodePropsResolver(localResolver, inheritedResolver);
    const resolvedProps = composedResolver?.({
      node: { id: 'node-1', type: 'Text' },
      props: baseProps,
    });

    expect(resolvedProps).toEqual({
      text: 'local',
      tone: 'muted',
      inherited: true,
      local: true,
    });
    expect(baseProps).toEqual({ text: 'base', tone: 'muted' });
    expect(calls).toEqual(['inherited', 'local']);
  });

  it('merges action handlers additively and lets local handlers override inherited ones', () => {
    const inheritedNavigate = () => undefined;
    const inheritedSetLanguage = () => undefined;
    const localSetLanguage = () => undefined;

    const merged = mergeRuntimeRendererConfig(
      {
        actionHandlers: {
          setLanguage: localSetLanguage,
        },
      },
      {
        actionHandlers: {
          navigate: inheritedNavigate,
          setLanguage: inheritedSetLanguage,
        },
      },
    );

    expect(merged.actionHandlers).toEqual({
      navigate: inheritedNavigate,
      setLanguage: localSetLanguage,
    });
  });

  it('prefers local executeAction over inherited executeAction', () => {
    const inheritedExecuteAction = () => undefined;
    const localExecuteAction = () => undefined;

    const merged = mergeRuntimeRendererConfig(
      {
        executeAction: localExecuteAction,
      },
      {
        executeAction: inheritedExecuteAction,
      },
    );

    expect(merged.executeAction).toBe(localExecuteAction);
  });
});
