import type {
  BindingExpression,
  ComponentDataBindingRegistry,
  StateAdapter,
} from '@ankhorage/contracts';
import React from 'react';

/*** Re-renders a Runtime node when one of its state-backed presentation bindings changes. */
export function useRuntimeStateBindings(args: {
  readonly dataBindings?: ComponentDataBindingRegistry;
  readonly nodeId: string;
  readonly stateAdapter?: StateAdapter;
}): void {
  const { dataBindings, nodeId, stateAdapter } = args;
  const paths = React.useMemo(
    () => collectStateBindingPaths(findDataBindingProps(dataBindings, nodeId)),
    [dataBindings, nodeId],
  );
  const [, setVersion] = React.useState(0);

  React.useEffect(() => {
    if (stateAdapter === undefined || paths.length === 0) return undefined;

    const subscriptions = paths.flatMap((path) => {
      const result = stateAdapter.subscribe(path, () => {
        setVersion((version) => version + 1);
      });
      return result.ok ? [result.data] : [];
    });

    return () => {
      for (const subscription of subscriptions) void subscription.unsubscribe();
    };
  }, [paths, stateAdapter]);
}

function findDataBindingProps(
  dataBindings: ComponentDataBindingRegistry | undefined,
  nodeId: string,
): ComponentDataBindingRegistry[string]['props'] | undefined {
  return Object.values(dataBindings ?? {}).find((binding) => binding.componentId === nodeId)?.props;
}

function collectStateBindingPaths(
  props: ComponentDataBindingRegistry[string]['props'] | undefined,
): readonly string[] {
  const paths = Object.values(props ?? {}).flatMap((binding) =>
    collectStateExpressionPaths(binding.value),
  );
  return [...new Set(paths)].sort();
}

function collectStateExpressionPaths(expression: BindingExpression): readonly string[] {
  if ('capability' in expression)
    return expression.capability.startsWith('state.')
      ? [expression.capability.slice('state.'.length)]
      : [];
  if (expression.kind === 'literal') return [];
  if (expression.kind === 'array') return expression.items.flatMap(collectStateExpressionPaths);
  if (expression.kind === 'object')
    return Object.values(expression.fields).flatMap(collectStateExpressionPaths);
  if (expression.kind === 'transform') return collectStateExpressionPaths(expression.value);
  return [
    ...collectStateExpressionPaths(expression.value),
    ...collectStateExpressionPaths(expression.fallback),
  ];
}
