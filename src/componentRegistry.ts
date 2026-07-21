import type React from 'react';

export type ComponentRegistry = Readonly<Record<string, React.ElementType>>;

export function createComponentRegistry(
  ...registries: readonly ComponentRegistry[]
): ComponentRegistry {
  return registries.reduce<Record<string, React.ElementType>>((mergedRegistry, registry) => {
    return { ...mergedRegistry, ...registry };
  }, {});
}
