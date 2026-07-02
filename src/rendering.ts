import type React from 'react';

import type { ComponentRegistry } from './registry';

export function resolveRuntimeRegistry(args: {
  propRegistry?: ComponentRegistry;
  configRegistry?: ComponentRegistry;
  fallbackRegistry: ComponentRegistry;
}): ComponentRegistry {
  const { propRegistry, configRegistry, fallbackRegistry } = args;
  return propRegistry ?? configRegistry ?? fallbackRegistry;
}

export function resolveRenderedChildren(args: {
  propChildren: React.ReactNode;
  renderedChildren: React.ReactNode[] | undefined;
}): React.ReactNode {
  const { propChildren, renderedChildren } = args;

  if (renderedChildren && renderedChildren.length > 0) {
    return renderedChildren;
  }

  return propChildren;
}

export function getUnknownComponentDiagnostic(
  componentType: string,
  registry: ComponentRegistry,
): {
  title: string;
  detail: string;
  suggestion: string;
} {
  const registeredTypes = Object.keys(registry).sort();
  const preview = registeredTypes.slice(0, 8).join(', ');
  const remainingCount = Math.max(registeredTypes.length - 8, 0);

  return {
    title: `Unknown component type: ${componentType}`,
    detail:
      registeredTypes.length === 0
        ? 'No component registry is active for this render tree.'
        : `Registered types: ${preview}${remainingCount > 0 ? `, +${remainingCount} more` : ''}.`,
    suggestion:
      'Check the active runtime component registry. ZORA manifests require a ZORA-aware registry.',
  };
}
