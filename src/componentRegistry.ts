import type React from 'react';

export type ComponentRegistry = Record<string, React.ElementType>;

export function createComponentRegistry(
  ...registries: readonly ComponentRegistry[]
): ComponentRegistry {
  return registries.reduce<ComponentRegistry>((mergedRegistry, registry) => {
    return { ...mergedRegistry, ...registry };
  }, {});
}
