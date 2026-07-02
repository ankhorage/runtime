import type {
  ComponentDataBindingRegistry,
  StateAdapter,
  StatePath,
  StateResult,
  StateSubscription,
  StateValue,
  UiNode,
} from '@ankhorage/contracts';
import { describe, expect, it } from 'bun:test';

import { resolveRuntimeBindings } from './runtimeBindings';
import { resolveRuntimeNodeProps } from './runtimeNodeProps';
import { mergeRuntimeRendererConfig } from './RuntimeRendererConfig';

function createFakeStateAdapter(values: Record<string, StateValue>): StateAdapter {
  return {
    capabilities: {
      subscriptions: true,
      computed: false,
      persistence: false,
    },
    get<TValue extends StateValue = StateValue>(path: StatePath): StateResult<TValue | undefined> {
      const key = typeof path === 'string' ? path : path.join('.');
      return {
        ok: true,
        data: values[key] as TValue | undefined,
      } as StateResult<TValue | undefined>;
    },
    set(): StateResult {
      return { ok: true };
    },
    subscribe(): StateResult<StateSubscription> {
      return {
        ok: true,
        data: {
          unsubscribe() {
            return undefined;
          },
        },
      };
    },
    delete(): StateResult {
      return { ok: true };
    },
  };
}

const titleNode: UiNode = {
  id: 'title',
  type: 'Text',
  props: {
    text: 'Fallback',
  },
};

const titleDataBindings: ComponentDataBindingRegistry = {
  title: {
    componentId: 'title',
    props: {
      text: {
        source: {
          kind: 'state',
          path: 'screen.title',
        },
      },
    },
  },
};

describe('runtime state adapter wiring', () => {
  it('keeps state adapters provider-neutral in runtime config', () => {
    const inheritedAdapter = createFakeStateAdapter({ 'screen.title': 'Inherited' });
    const localAdapter = createFakeStateAdapter({ 'screen.title': 'Local' });

    const inheritedConfig = {
      stateAdapter: inheritedAdapter,
    };
    const localConfig = {
      stateAdapter: localAdapter,
    };

    expect(mergeRuntimeRendererConfig(undefined, inheritedConfig).stateAdapter).toBe(
      inheritedAdapter,
    );
    expect(mergeRuntimeRendererConfig(localConfig, inheritedConfig).stateAdapter).toBe(
      localAdapter,
    );
  });

  it('resolves state values through configured adapters without engine-specific props', () => {
    const props = resolveRuntimeNodeProps({
      node: titleNode,
      dataBindings: titleDataBindings,
      stateAdapter: createFakeStateAdapter({
        'screen.title': 'Hello from state',
      }),
    });

    expect(props).toEqual({
      testID: 'title',
      text: 'Hello from state',
    });
    expect(Object.values(props).some((value) => typeof value === 'function')).toBe(false);
  });

  it('falls back deterministically when no state adapter is configured', () => {
    expect(
      resolveRuntimeBindings({
        dataBindings: titleDataBindings,
        node: titleNode,
        props: titleNode.props ?? {},
      }),
    ).toEqual({
      diagnostics: [],
      props: {
        text: undefined,
      },
    });
  });
});
