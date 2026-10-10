import type {
  ComponentDataBindingRegistry,
  DbAdapter,
  DbRealtimeAdapter,
  StateAdapter,
  UiNode,
} from '@ankhorage/contracts';
import { isMediaAssetReference } from '@ankhorage/contracts';

import { resolveRuntimeBindings, type RuntimeBindingResultCache } from './runtimeBindings';
import type { RuntimeRendererConfig } from './RuntimeRendererConfig';

/*** Resolves a node's authored props and synchronous binding expressions for one render pass. */
export function resolveRuntimeNodeProps(args: {
  readonly node: UiNode;
  readonly resolveNodeProps?: RuntimeRendererConfig['resolveNodeProps'];
  readonly stateAdapter?: StateAdapter;
  readonly dbAdapter?: DbAdapter;
  readonly dbRealtimeAdapter?: DbRealtimeAdapter;
  readonly bindingContext?: Record<string, unknown>;
  readonly dataBindings?: ComponentDataBindingRegistry;
  readonly resultSlots?: RuntimeBindingResultCache;
}): Record<string, unknown> {
  const props: Record<string, unknown> = { testID: args.node.id, ...(args.node.props ?? {}) };
  if (args.node.type === 'Image' && !isMediaAssetReference(props.source)) {
    const source = resolveImageAssetUrl(props.source);
    if (source === undefined) delete props.source;
    else props.source = source;
  }
  if (args.node.style) props.style = props.style ? [props.style, args.node.style] : args.node.style;

  const binding = resolveRuntimeBindings({
    context: args.bindingContext,
    dataBindings: args.dataBindings,
    node: args.node,
    props,
    resultSlots: args.resultSlots,
    stateAdapter: args.stateAdapter,
  });
  return args.resolveNodeProps
    ? args.resolveNodeProps({ node: args.node, props: binding.props })
    : binding.props;
}

function resolveImageAssetUrl(value: unknown): string | undefined {
  if (typeof value === 'string') return value.trim() || undefined;
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return undefined;
  const record = value as Record<string, unknown>;
  if (record.kind === 'url' && typeof record.url === 'string')
    return record.url.trim() || undefined;
  if (record.kind === 'storage' && typeof record.publicUrl === 'string')
    return record.publicUrl.trim() || undefined;
  return undefined;
}
