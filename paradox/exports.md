# Public API

## applyRuntimeBindingDataPath

Kind: `function`
Module: `src/runtimeBindings.ts`
Source: `src/runtimeBindings.ts:206:1`

Applies a dotted path to a serializable binding value.

### Signatures

- `(value: import("@ankhorage/contracts").SerializableValue | undefined, path: string | undefined) => import("@ankhorage/contracts").SerializableValue | undefined`
  - path: `string | undefined`
  - value: `import("@ankhorage/contracts").SerializableValue | undefined`
  - returns: `import("@ankhorage/contracts").SerializableValue | undefined`

## ComponentRegistry

Kind: `unknown`
Module: `src/componentRegistry.ts`
Source: `src/componentRegistry.ts:3:1`

## composeRuntimeCapabilityExecutor

Kind: `function`
Module: `src/runtimeCapabilityExecutor.ts`
Source: `src/runtimeCapabilityExecutor.ts:17:1`

Routes API and state capabilities before delegating application-owned capabilities.

### Signatures

- `(composition: RuntimeCapabilityExecutorComposition) => RuntimeCapabilityExecutor`
  - composition: `RuntimeCapabilityExecutorComposition`
  - returns: `RuntimeCapabilityExecutor`

## composeRuntimeNodePropsResolver

Kind: `function`
Module: `src/RuntimeRendererConfig.tsx`
Source: `src/RuntimeRendererConfig.tsx:79:1`

### Signatures

- `(localResolver?: RuntimeNodePropsResolver | undefined, inheritedResolver?: RuntimeNodePropsResolver | undefined) => RuntimeNodePropsResolver | undefined`
  - inheritedResolver: `RuntimeNodePropsResolver | undefined` (optional)
  - localResolver: `RuntimeNodePropsResolver | undefined` (optional)
  - returns: `RuntimeNodePropsResolver | undefined`

## composeRuntimeRendererWrapNode

Kind: `function`
Module: `src/RuntimeRendererConfig.tsx`
Source: `src/RuntimeRendererConfig.tsx:64:1`

### Signatures

- `(innerWrapNode?: ((args: RuntimeRendererWrapArgs) => React.ReactNode) | undefined, outerWrapNode?: ((args: RuntimeRendererWrapArgs) => React.ReactNode) | undefined) => ((args: RuntimeRendererWrapArgs) => React.ReactNode) | undefined`
  - innerWrapNode: `((args: RuntimeRendererWrapArgs) => React.ReactNode) | undefined` (optional)
  - outerWrapNode: `((args: RuntimeRendererWrapArgs) => React.ReactNode) | undefined` (optional)
  - returns: `((args: RuntimeRendererWrapArgs) => React.ReactNode) | undefined`

## createComponentEventFromHandlerArgs

Kind: `function`
Module: `src/runtimeActionRegistry.ts`
Source: `src/runtimeActionRegistry.ts:179:1`

Maps a platform callback invocation to the portable component event representation.

### Signatures

- `(args: { readonly capability?: Capability["id"]; readonly node: UiNode; readonly eventName: string; readonly handlerArgs: readonly unknown[]; }) => ComponentEventDto<string, RuntimeEventPayload>`
  - args: `{ readonly capability?: Capability["id"]; readonly node: UiNode; readonly eventName: string; readonly handlerArgs: readonly unknown[]; }`
  - returns: `ComponentEventDto<string, RuntimeEventPayload>`

## createComponentRegistry

Kind: `function`
Module: `src/componentRegistry.ts`
Source: `src/componentRegistry.ts:5:1`

### Signatures

- `(registries?: readonly Readonly<Record<string, React.ElementType<any, keyof React.JSX.IntrinsicElements>>>[]) => Readonly<Record<string, React.ElementType<any, keyof React.JSX.IntrinsicElements>>>`
  - registries: `readonly Readonly<Record<string, React.ElementType<any, keyof React.JSX.IntrinsicElements>>>[]` (optional)
  - returns: `Readonly<Record<string, React.ElementType<any, keyof React.JSX.IntrinsicElements>>>`

## createPendingRuntimeScreenOperationLoaderState

Kind: `function`
Module: `src/runtimeScreenLoaders.ts`
Source: `src/runtimeScreenLoaders.ts:85:1`

Constructs a pending state for capability-backed screen loaders.

### Signatures

- `(args: { readonly dependencyKey: string; readonly previousState?: RuntimeScreenOperationLoaderState; }) => RuntimeScreenOperationLoaderState`
  - args: `{ readonly dependencyKey: string; readonly previousState?: RuntimeScreenOperationLoaderState; }`
  - returns: `RuntimeScreenOperationLoaderState`

## createRuntimeActionRegistry

Kind: `function`
Module: `src/runtimeActionRegistry.ts`
Source: `src/runtimeActionRegistry.ts:69:1`

Creates a registry that dispatches every authored event through one capability executor.

### Signatures

- `(options?: Pick<RuntimeComponentEventDispatchArgs, "dataBindings" | "eventOperationLifecycle" | "executeCapability" | "resultSlots" | "writeResultSlot">) => RuntimeActionRegistry`
  - options: `Pick<RuntimeComponentEventDispatchArgs, "dataBindings" | "eventOperationLifecycle" | "executeCapability" | "resultSlots" | "writeResultSlot">` (optional)
  - returns: `RuntimeActionRegistry`

## createRuntimeApiCapabilityExecutor

Kind: `function`
Module: `src/runtimeApiCapabilities.ts`
Source: `src/runtimeApiCapabilities.ts:23:1`

Creates the canonical API capability adapter over Runtime's existing data-operation executor.

### Signatures

- `(options: RuntimeApiCapabilityExecutorOptions) => RuntimeCapabilityExecutor`
  - options: `RuntimeApiCapabilityExecutorOptions`
  - returns: `RuntimeCapabilityExecutor`

## createRuntimeEventOperationBindingContext

Kind: `function`
Module: `src/runtimeEventOperationLifecycle.ts`
Source: `src/runtimeEventOperationLifecycle.ts:93:1`

### Signatures

- `(context: Record<string, unknown> | undefined, state: RuntimeEventOperationState) => Record<string, unknown>`
  - context: `Record<string, unknown> | undefined`
  - state: `RuntimeEventOperationState`
  - returns: `Record<string, unknown>`

## createRuntimeEventOperationLifecycle

Kind: `function`
Module: `src/runtimeEventOperationLifecycle.ts`
Source: `src/runtimeEventOperationLifecycle.ts:40:1`

### Signatures

- `(onStateChange: (state: RuntimeEventOperationState) => void) => RuntimeEventOperationLifecycle`
  - onStateChange: `(state: RuntimeEventOperationState) => void`
  - returns: `RuntimeEventOperationLifecycle`

## createRuntimeMemoryStateAdapter

Kind: `function`
Module: `src/runtimeStateAdapter.ts`
Source: `src/runtimeStateAdapter.ts:22:1`

### Signatures

- `(options?: RuntimeMemoryStateAdapterOptions) => StateAdapter`
  - options: `RuntimeMemoryStateAdapterOptions` (optional)
  - returns: `StateAdapter`

## createRuntimeScreenLoaderRequestKey

Kind: `function`
Module: `src/runtimeScreenLoaders.ts`
Source: `src/runtimeScreenLoaders.ts:65:1`

Creates a deterministic loader request key from resolved inputs and declared result slots.

### Signatures

- `(args: { readonly screenId: string; readonly loaders: readonly ScreenDataLoaderDefinition[]; readonly bindingContext?: Record<string, unknown>; readonly resultSlots?: RuntimeBindingResultCache; }) => string`
  - args: `{ readonly screenId: string; readonly loaders: readonly ScreenDataLoaderDefinition[]; readonly bindingContext?: Record<string, unknown>; readonly resultSlots?: RuntimeBindingResultCache; }`
  - returns: `string`

## createRuntimeScreenOperationLoaderRequestLifecycle

Kind: `function`
Module: `src/runtimeScreenLoaders.ts`
Source: `src/runtimeScreenLoaders.ts:37:1`

Tracks one active screen-loader request per effective dependency key.

### Signatures

- `() => RuntimeScreenOperationLoaderRequestLifecycle`
  - returns: `RuntimeScreenOperationLoaderRequestLifecycle`

## dispatchRuntimeComponentEvent

Kind: `function`
Module: `src/runtimeActionRegistry.ts`
Source: `src/runtimeActionRegistry.ts:87:1`

Executes every matching event invocation through the canonical capability path.

### Signatures

- `(args: RuntimeComponentEventDispatchArgs) => Promise<readonly DataSourceDiagnostic[]>`
  - args: `RuntimeComponentEventDispatchArgs`
  - returns: `Promise<readonly DataSourceDiagnostic[]>`

## dispatchRuntimeComponentEventWithReporting

Kind: `function`
Module: `src/runtimeEventExecution.ts`
Source: `src/runtimeEventExecution.ts:13:1`

### Signatures

- `(args: RuntimeComponentEventDispatchArgs & RuntimeEventDiagnosticsReporter) => Promise<readonly DataSourceDiagnostic[]>`
  - args: `RuntimeComponentEventDispatchArgs & RuntimeEventDiagnosticsReporter`
  - returns: `Promise<readonly DataSourceDiagnostic[]>`

## executeRuntimeBindingInvocation

Kind: `function`
Module: `src/runtimeBindings.ts`
Source: `src/runtimeBindings.ts:179:1`

Invokes one capability and records its structured result under its declared local slot.

### Signatures

- `(invocation: BindingInvocation, context: RuntimeBindingResolutionContext, args?: Pick<RuntimeCapabilityExecutionArgs, "event" | "node">, diagnostics?: DataSourceDiagnostic[]) => Promise<RuntimeCapabilityExecutionResult | undefined>`
  - args: `Pick<RuntimeCapabilityExecutionArgs, "event" | "node">` (optional)
  - context: `RuntimeBindingResolutionContext`
  - diagnostics: `DataSourceDiagnostic[]` (optional)
  - invocation: `BindingInvocation`
  - returns: `Promise<RuntimeCapabilityExecutionResult | undefined>`

## executeRuntimeScreenOperationLoaders

Kind: `function`
Module: `src/runtimeScreenLoaders.ts`
Source: `src/runtimeScreenLoaders.ts:98:1`

Executes screen loaders through the same invocation and result-slot machinery as events.

### Signatures

- `(args: { readonly bindingContext?: Record<string, unknown>; readonly executeCapability?: RuntimeCapabilityExecutor; readonly resultSlots?: RuntimeBindingResultCache; readonly screen: ScreenSpec; readonly loaders: readonly ScreenDataLoaderDefinition[]; }) => Promise<RuntimeScreenOperationLoaderExecutionResult>`
  - args: `{ readonly bindingContext?: Record<string, unknown>; readonly executeCapability?: RuntimeCapabilityExecutor; readonly resultSlots?: RuntimeBindingResultCache; readonly screen: ScreenSpec; readonly loaders: readonly ScreenDataLoaderDefinition[]; }`
  - returns: `Promise<RuntimeScreenOperationLoaderExecutionResult>`

## IDLE_RUNTIME_EVENT_OPERATION_STATE

Kind: `value`
Module: `src/runtimeEventOperationLifecycle.ts`
Source: `src/runtimeEventOperationLifecycle.ts:28:14`

## isRuntimeContextCapabilityOutputPath

Kind: `function`
Module: `src/capabilities/resolveRuntimeContextCapability.ts`
Source: `src/capabilities/resolveRuntimeContextCapability.ts:45:1`

Determines whether a dot-separated path is exposed by a capability output schema.

### Signatures

- `(args: { readonly capability: Capability; readonly path: string; }) => boolean`
  - args: `{ readonly capability: Capability; readonly path: string; }`
  - returns: `boolean`

## ManifestContext

Kind: `value`
Module: `src/ManifestContext.tsx`
Source: `src/ManifestContext.tsx:13:14`

## ManifestProvider

Kind: `function`
Module: `src/ManifestContext.tsx`
Source: `src/ManifestContext.tsx:16:1`

Owns one configured state adapter for every Runtime screen in an application tree.

### Signatures

- `(props: ManifestContextValue & { children: React.ReactNode; }) => React.JSX.Element`
  - props: `ManifestContextValue & { children: React.ReactNode; }`
  - returns: `React.JSX.Element`

## mergeRuntimeRendererConfig

Kind: `function`
Module: `src/RuntimeRendererConfig.tsx`
Source: `src/RuntimeRendererConfig.tsx:97:1`

### Signatures

- `(localConfig: RuntimeRendererConfig | undefined, inheritedConfig: RuntimeRendererConfig | undefined) => RuntimeRendererConfig`
  - inheritedConfig: `RuntimeRendererConfig | undefined`
  - localConfig: `RuntimeRendererConfig | undefined`
  - returns: `RuntimeRendererConfig`

## resolveBindingInputMap

Kind: `function`
Module: `src/runtimeBindings.ts`
Source: `src/runtimeBindings.ts:159:1`

Resolves an invocation input map recursively.

### Signatures

- `(input: Readonly<Record<string, BindingExpression>> | undefined, context: RuntimeBindingResolutionContext, diagnostics?: DataSourceDiagnostic[]) => Promise<import("@ankhorage/contracts").SerializableValue | undefined>`
  - context: `RuntimeBindingResolutionContext`
  - diagnostics: `DataSourceDiagnostic[]` (optional)
  - input: `Readonly<Record<string, BindingExpression>> | undefined`
  - returns: `Promise<import("@ankhorage/contracts").SerializableValue | undefined>`

## resolveBindingInputMapSync

Kind: `function`
Module: `src/runtimeBindings.ts`
Source: `src/runtimeBindings.ts:170:1`

Resolves an invocation input map without executing a capability.

### Signatures

- `(input: Readonly<Record<string, BindingExpression>> | undefined, context: RuntimeBindingResolutionContext, diagnostics?: DataSourceDiagnostic[]) => import("@ankhorage/contracts").SerializableValue | undefined`
  - context: `RuntimeBindingResolutionContext`
  - diagnostics: `DataSourceDiagnostic[]` (optional)
  - input: `Readonly<Record<string, BindingExpression>> | undefined`
  - returns: `import("@ankhorage/contracts").SerializableValue | undefined`

## resolveRuntimeActionValue

Kind: `function`
Module: `src/runtimeActionRegistry.ts`
Source: `src/runtimeActionRegistry.ts:193:1`

Resolves an authored expression-shaped payload for imperative consumers.

### Signatures

- `(value: BindingExpression, args: RuntimeActionResolutionArgs) => import("@ankhorage/contracts").SerializableValue | undefined`
  - args: `RuntimeActionResolutionArgs`
  - value: `BindingExpression`
  - returns: `import("@ankhorage/contracts").SerializableValue | undefined`

## resolveRuntimeBindingExpression

Kind: `function`
Module: `src/runtimeBindings.ts`
Source: `src/runtimeBindings.ts:90:1`

Resolves one recursive Contracts expression, executing a capability only when needed.

### Signatures

- `(expression: BindingExpression, context: RuntimeBindingResolutionContext, diagnostics?: DataSourceDiagnostic[]) => Promise<import("@ankhorage/contracts").SerializableValue | undefined>`
  - context: `RuntimeBindingResolutionContext`
  - diagnostics: `DataSourceDiagnostic[]` (optional)
  - expression: `BindingExpression`
  - returns: `Promise<import("@ankhorage/contracts").SerializableValue | undefined>`

## resolveRuntimeBindingExpressionSync

Kind: `function`
Module: `src/runtimeBindings.ts`
Source: `src/runtimeBindings.ts:116:1`

Resolves one expression without side effects for synchronous rendering.

### Signatures

- `(expression: BindingExpression, context: RuntimeBindingResolutionContext, diagnostics?: DataSourceDiagnostic[]) => import("@ankhorage/contracts").SerializableValue | undefined`
  - context: `RuntimeBindingResolutionContext`
  - diagnostics: `DataSourceDiagnostic[]` (optional)
  - expression: `BindingExpression`
  - returns: `import("@ankhorage/contracts").SerializableValue | undefined`

## resolveRuntimeBindings

Kind: `function`
Module: `src/runtimeBindings.ts`
Source: `src/runtimeBindings.ts:76:1`

Resolves property bindings using only already materialized capability values.

### Signatures

- `(args: RuntimeBindingResolutionArgs) => RuntimeBindingResolutionResult`
  - args: `RuntimeBindingResolutionArgs`
  - returns: `RuntimeBindingResolutionResult`

## resolveRuntimeBindingsAsync

Kind: `function`
Module: `src/runtimeBindings.ts`
Source: `src/runtimeBindings.ts:62:1`

Resolves every property binding through the canonical expression boundary.

### Signatures

- `(args: RuntimeBindingResolutionArgs) => Promise<RuntimeBindingResolutionResult>`
  - args: `RuntimeBindingResolutionArgs`
  - returns: `Promise<RuntimeBindingResolutionResult>`

## resolveRuntimeBindingValue

Kind: `function`
Module: `src/runtimeBindings.ts`
Source: `src/runtimeBindings.ts:141:1`

Resolves a property binding expression.

### Signatures

- `(binding: PropBinding, context: RuntimeBindingResolutionContext, diagnostics?: DataSourceDiagnostic[]) => Promise<import("@ankhorage/contracts").SerializableValue | undefined>`
  - binding: `PropBinding`
  - context: `RuntimeBindingResolutionContext`
  - diagnostics: `DataSourceDiagnostic[]` (optional)
  - returns: `Promise<import("@ankhorage/contracts").SerializableValue | undefined>`

## resolveRuntimeBindingValueSync

Kind: `function`
Module: `src/runtimeBindings.ts`
Source: `src/runtimeBindings.ts:150:1`

Resolves a property binding expression without executing a capability.

### Signatures

- `(binding: PropBinding, context: RuntimeBindingResolutionContext, diagnostics?: DataSourceDiagnostic[]) => import("@ankhorage/contracts").SerializableValue | undefined`
  - binding: `PropBinding`
  - context: `RuntimeBindingResolutionContext`
  - diagnostics: `DataSourceDiagnostic[]` (optional)
  - returns: `import("@ankhorage/contracts").SerializableValue | undefined`

## resolveRuntimeContextCapability

Kind: `function`
Module: `src/capabilities/resolveRuntimeContextCapability.ts`
Source: `src/capabilities/resolveRuntimeContextCapability.ts:16:1`

Materializes a Runtime-owned context capability for the active renderer scope.

### Signatures

- `(args: { readonly id: string; readonly repeatSourceSchema?: DataSchema; }) => RuntimeContextCapabilityResolution`
  - args: `{ readonly id: string; readonly repeatSourceSchema?: DataSchema; }`
  - returns: `RuntimeContextCapabilityResolution`

## resolveRuntimeEventOperationErrorMessage

Kind: `function`
Module: `src/runtimeEventOperationLifecycle.ts`
Source: `src/runtimeEventOperationLifecycle.ts:114:1`

### Signatures

- `(diagnostics: readonly DataSourceDiagnostic[]) => string`
  - diagnostics: `readonly DataSourceDiagnostic[]`
  - returns: `string`

## resolveScreenOperationLoaders

Kind: `function`
Module: `src/runtimeScreenLoaders.ts`
Source: `src/runtimeScreenLoaders.ts:58:1`

Returns the portable capability invocations authored on a screen.

### Signatures

- `(screen: ScreenSpec) => readonly import("@ankhorage/contracts").BindingInvocation[]`
  - screen: `ScreenSpec`
  - returns: `readonly import("@ankhorage/contracts").BindingInvocation[]`

## RuntimeActionDescriptor

Kind: `type`
Module: `src/runtimeManifest.ts`
Source: `src/runtimeManifest.ts:17:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| capability | property | ``${string}.${string}` \| undefined` | no |  |
| data | property | `Data \| undefined` | no |  |
| description | property | `string \| undefined` | no |  |
| id | property | `string` | yes |  |

## RuntimeActionRegistry

Kind: `type`
Module: `src/runtimeActionRegistry.ts`
Source: `src/runtimeActionRegistry.ts:33:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| dispatchComponentEvent | method | `(args: RuntimeComponentEventDispatchArgs) => Promise<void>` | yes |  |

## RuntimeActionResolutionArgs

Kind: `type`
Module: `src/runtimeActionRegistry.ts`
Source: `src/runtimeActionRegistry.ts:43:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| context | property | `Record<string, unknown> \| undefined` | no |  |
| event | property | `ComponentEventDto<string, object>` | yes |  |
| resultSlots | property | `Readonly<Record<string, import("@ankhorage/contracts").SerializableValue \| undefined>> \| undefined` | no |  |
| state | property | `Record<string, unknown> \| undefined` | no |  |

## RuntimeActionResolutionScope

Kind: `type`
Module: `src/runtimeActionRegistry.ts`
Source: `src/runtimeActionRegistry.ts:37:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| context | property | `Record<string, unknown> \| undefined` | no |  |
| resultSlots | property | `Readonly<Record<string, import("@ankhorage/contracts").SerializableValue \| undefined>> \| undefined` | no |  |
| state | property | `Record<string, unknown> \| undefined` | no |  |

## RuntimeAdapterDescriptor

Kind: `type`
Module: `src/runtimeManifest.ts`
Source: `src/runtimeManifest.ts:32:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| id | property | `string` | yes |  |
| kind | property | `string` | yes |  |
| options | property | `Options \| undefined` | no |  |

## RuntimeApiCapabilityExecutorOptions

Kind: `type`
Module: `src/runtimeApiCapabilities.ts`
Source: `src/runtimeApiCapabilities.ts:16:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| apis | property | `ApiDefinitionRegistry` | yes |  |
| credentialResolver | property | `EndpointTestCredentialResolver \| undefined` | no |  |
| fetch | property | `EndpointTestFetch \| undefined` | no |  |

## RuntimeBindingDescriptor

Kind: `type`
Module: `src/runtimeManifest.ts`
Source: `src/runtimeManifest.ts:24:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| actionId | property | `string \| undefined` | no |  |
| id | property | `string` | yes |  |
| source | property | `string` | yes |  |
| target | property | `string` | yes |  |
| value | property | `Value \| undefined` | no |  |

## RuntimeBindingResolutionArgs

Kind: `type`
Module: `src/runtimeBindings.ts`
Source: `src/runtimeBindings.ts:51:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| capabilityValues | property | `Readonly<Record<string, import("@ankhorage/contracts").SerializableValue \| undefined>> \| undefined` | no |  |
| context | property | `Record<string, unknown> \| undefined` | no |  |
| dataBindings | property | `ComponentDataBindingRegistry \| undefined` | no |  |
| event | property | `ComponentEventDto<string, object> \| undefined` | no |  |
| executeCapability | property | `RuntimeCapabilityExecutor \| undefined` | no |  |
| node | property | `UiNode` | yes |  |
| props | property | `Record<string, unknown>` | yes |  |
| resultSlots | property | `Readonly<Record<string, import("@ankhorage/contracts").SerializableValue \| undefined>> \| undefined` | no |  |
| stateAdapter | property | `StateAdapter \| undefined` | no |  |
| writeResultSlot | property | `RuntimeBindingResultWriter \| undefined` | no |  |

## RuntimeBindingResolutionContext

Kind: `type`
Module: `src/runtimeBindings.ts`
Source: `src/runtimeBindings.ts:40:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| capabilityValues | property | `Readonly<Record<string, import("@ankhorage/contracts").SerializableValue \| undefined>> \| undefined` | no |  |
| context | property | `Record<string, unknown> \| undefined` | no |  |
| dataBindings | property | `ComponentDataBindingRegistry \| undefined` | no |  |
| event | property | `ComponentEventDto<string, object> \| undefined` | no |  |
| executeCapability | property | `RuntimeCapabilityExecutor \| undefined` | no |  |
| resultSlots | property | `Readonly<Record<string, import("@ankhorage/contracts").SerializableValue \| undefined>> \| undefined` | no |  |
| stateAdapter | property | `StateAdapter \| undefined` | no |  |
| writeResultSlot | property | `RuntimeBindingResultWriter \| undefined` | no |  |

## RuntimeBindingResolutionResult

Kind: `type`
Module: `src/runtimeBindings.ts`
Source: `src/runtimeBindings.ts:56:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| diagnostics | property | `readonly DataSourceDiagnostic[]` | yes |  |
| props | property | `Record<string, unknown>` | yes |  |

## RuntimeBindingResultCache

Kind: `unknown`
Module: `src/runtimeBindings.ts`
Source: `src/runtimeBindings.ts:18:1`

## RuntimeBindingResultWriter

Kind: `unknown`
Module: `src/runtimeBindings.ts`
Source: `src/runtimeBindings.ts:19:1`

## RuntimeCapabilityExecutionArgs

Kind: `type`
Module: `src/runtimeBindings.ts`
Source: `src/runtimeBindings.ts:21:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| capability | property | ``${string}.${string}`` | yes |  |
| event | property | `ComponentEventDto<string, object> \| undefined` | no |  |
| input | property | `import("@ankhorage/contracts").SerializableValue \| undefined` | no |  |
| node | property | `UiNode \| undefined` | no |  |

## RuntimeCapabilityExecutionResult

Kind: `unknown`
Module: `src/runtimeBindings.ts`
Source: `src/runtimeBindings.ts:28:1`

## RuntimeCapabilityExecutor

Kind: `unknown`
Module: `src/runtimeBindings.ts`
Source: `src/runtimeBindings.ts:36:1`

## RuntimeCapabilityExecutorComposition

Kind: `type`
Module: `src/runtimeCapabilityExecutor.ts`
Source: `src/runtimeCapabilityExecutor.ts:10:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| apiCapabilityExecutor | property | `RuntimeCapabilityExecutor` | yes |  |
| capabilityExecutor | property | `RuntimeCapabilityExecutor \| undefined` | no |  |
| stateAdapter | property | `StateAdapter \| undefined` | no |  |

## RuntimeComponentEventDispatchArgs

Kind: `type`
Module: `src/runtimeActionRegistry.ts`
Source: `src/runtimeActionRegistry.ts:47:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| context | property | `Record<string, unknown> \| undefined` | no |  |
| dataBindings | property | `ComponentDataBindingRegistry \| undefined` | no |  |
| event | property | `ComponentEventDto<string, object>` | yes |  |
| eventName | property | `string \| undefined` | no |  |
| eventOperationLifecycle | property | `RuntimeEventOperationLifecycle \| undefined` | no |  |
| executeCapability | property | `RuntimeCapabilityExecutor \| undefined` | no |  |
| node | property | `UiNode` | yes |  |
| resultSlots | property | `Readonly<Record<string, import("@ankhorage/contracts").SerializableValue \| undefined>> \| undefined` | no |  |
| state | property | `Record<string, unknown> \| undefined` | no |  |
| writeResultSlot | property | `RuntimeBindingResultWriter \| undefined` | no |  |

## RuntimeContextCapabilityId

Kind: `unknown`
Module: `src/capabilities/resolveRuntimeContextCapability.ts`
Source: `src/capabilities/resolveRuntimeContextCapability.ts:6:1`

## RuntimeContextCapabilityResolution

Kind: `unknown`
Module: `src/capabilities/resolveRuntimeContextCapability.ts`
Source: `src/capabilities/resolveRuntimeContextCapability.ts:8:1`

## RuntimeDiagnostic

Kind: `type`
Module: `src/runtimeManifest.ts`
Source: `src/runtimeManifest.ts:5:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| code | property | `string` | yes |  |
| message | property | `string` | yes |  |
| severity | property | `"error" \| "info" \| "warning"` | yes |  |

## RuntimeEventCapabilityResolver

Kind: `unknown`
Module: `src/runtimeActionRegistry.ts`
Source: `src/runtimeActionRegistry.ts:28:1`

## RuntimeEventDiagnosticsReporter

Kind: `type`
Module: `src/runtimeEventExecution.ts`
Source: `src/runtimeEventExecution.ts:8:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| consoleImpl | property | `Pick<Console, "error" \| "warn"> \| undefined` | no |  |
| onDiagnostics | property | `((diagnostics: readonly DataSourceDiagnostic[]) => void) \| undefined` | no |  |

## RuntimeEventOperationInvocation

Kind: `type`
Module: `src/runtimeEventOperationLifecycle.ts`
Source: `src/runtimeEventOperationLifecycle.ts:15:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| id | property | `number` | yes |  |

## RuntimeEventOperationLifecycle

Kind: `type`
Module: `src/runtimeEventOperationLifecycle.ts`
Source: `src/runtimeEventOperationLifecycle.ts:19:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| fail | method | `(invocation: RuntimeEventOperationInvocation, message: string) => void` | yes |  |
| start | method | `(args: { readonly nodeId: string; readonly capability: Capability["id"]; }) => RuntimeEventOperationInvocation \| undefined` | yes |  |
| succeed | method | `(invocation: RuntimeEventOperationInvocation) => void` | yes |  |

## RuntimeEventOperationState

Kind: `type`
Module: `src/runtimeEventOperationLifecycle.ts`
Source: `src/runtimeEventOperationLifecycle.ts:7:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| capability | property | ``${string}.${string}` \| undefined` | no |  |
| errorMessage | property | `string` | yes |  |
| loading | property | `boolean` | yes |  |
| nodeId | property | `string \| undefined` | no |  |
| status | property | `RuntimeEventOperationStatus` | yes |  |

## RuntimeEventOperationStatus

Kind: `unknown`
Module: `src/runtimeEventOperationLifecycle.ts`
Source: `src/runtimeEventOperationLifecycle.ts:5:1`

## RuntimeEventPropWrapArgs

Kind: `type`
Module: `src/runtimeActionRegistry.ts`
Source: `src/runtimeActionRegistry.ts:57:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| context | property | `Record<string, unknown> \| undefined` | no |  |
| dataBindings | property | `ComponentDataBindingRegistry \| undefined` | no |  |
| disableActions | property | `boolean` | yes |  |
| dispatchComponentEvent | property | `(args: RuntimeComponentEventDispatchArgs) => Promise<void> \| void` | yes |  |
| node | property | `UiNode` | yes |  |
| props | property | `Record<string, unknown>` | yes |  |
| resolveEventCapability | property | `RuntimeEventCapabilityResolver \| undefined` | no |  |
| resultSlots | property | `Readonly<Record<string, import("@ankhorage/contracts").SerializableValue \| undefined>> \| undefined` | no |  |
| state | property | `Record<string, unknown> \| undefined` | no |  |

## RuntimeManifest

Kind: `type`
Module: `src/runtimeManifest.ts`
Source: `src/runtimeManifest.ts:38:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| actions | property | `readonly RuntimeActionDescriptor<unknown>[]` | yes |  |
| adapters | property | `readonly RuntimeAdapterDescriptor<unknown>[]` | yes |  |
| bindings | property | `readonly RuntimeBindingDescriptor<unknown>[]` | yes |  |
| config | property | `RuntimeManifestConfig` | yes |  |
| diagnostics | property | `readonly RuntimeDiagnostic[]` | yes |  |
| kind | property | `"ankhorage-runtime-manifest"` | yes |  |
| version | property | `1` | yes |  |

## RuntimeManifestConfig

Kind: `type`
Module: `src/runtimeManifest.ts`
Source: `src/runtimeManifest.ts:11:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| appId | property | `string` | yes |  |
| environment | property | `string \| undefined` | no |  |
| values | property | `Readonly<Record<string, unknown>> \| undefined` | no |  |

## RuntimeManifestInput

Kind: `type`
Module: `src/runtimeManifest.ts`
Source: `src/runtimeManifest.ts:48:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| actions | property | `readonly RuntimeActionDescriptor<unknown>[] \| undefined` | no |  |
| adapters | property | `readonly RuntimeAdapterDescriptor<unknown>[] \| undefined` | no |  |
| bindings | property | `readonly RuntimeBindingDescriptor<unknown>[] \| undefined` | no |  |
| config | property | `RuntimeManifestConfig` | yes |  |
| diagnostics | property | `readonly RuntimeDiagnostic[] \| undefined` | no |  |

## RuntimeMediaAssetResolver

Kind: `unknown`
Module: `src/runtimeMedia.ts`
Source: `src/runtimeMedia.ts:13:1`

## RuntimeMediaAssetResolverArgs

Kind: `type`
Module: `src/runtimeMedia.ts`
Source: `src/runtimeMedia.ts:9:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| asset | property | `MediaAsset` | yes |  |

## RuntimeMemoryStateAdapterOptions

Kind: `type`
Module: `src/runtimeStateAdapter.ts`
Source: `src/runtimeStateAdapter.ts:18:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| initialState | property | `Readonly<Record<string, import("@ankhorage/contracts").SerializableValue>> \| undefined` | no |  |

## RuntimeNodePropsResolver

Kind: `unknown`
Module: `node_modules/@ankhorage/contracts/dist/runtimeCallbacks.d.ts`
Source: `node_modules/@ankhorage/contracts/dist/runtimeCallbacks.d.ts:6:1`

## RuntimeRenderer

Kind: `function`
Module: `src/RuntimeRenderer.tsx`
Source: `src/RuntimeRenderer.tsx:74:1`

### Signatures

- `(props: RuntimeRendererProps) => React.JSX.Element`
  - props: `RuntimeRendererProps`
  - returns: `React.JSX.Element`

## RuntimeRendererConfig

Kind: `type`
Module: `src/RuntimeRendererConfig.tsx`
Source: `src/RuntimeRendererConfig.tsx:37:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| bindingContext | property | `Record<string, unknown> \| undefined` | no |  |
| dataBindings | property | `ComponentDataBindingRegistry \| undefined` | no |  |
| dbAdapter | property | `DbAdapter \| undefined` | no |  |
| dbRealtimeAdapter | property | `DbRealtimeAdapter \| undefined` | no |  |
| disableActions | property | `boolean \| undefined` | no |  |
| eventOperationLifecycle | property | `RuntimeEventOperationLifecycle \| undefined` | no |  |
| eventOperationState | property | `RuntimeEventOperationState \| undefined` | no |  |
| executeCapability | property | `RuntimeCapabilityExecutor \| undefined` | no |  |
| mediaAssets | property | `MediaAssetRegistry \| undefined` | no |  |
| onDiagnostics | property | `((diagnostics: readonly DataSourceDiagnostic[]) => void) \| undefined` | no |  |
| registry | property | `Readonly<Record<string, React.ElementType<any, keyof React.JSX.IntrinsicElements>>> \| undefined` | no |  |
| resolveEventCapability | property | `RuntimeEventCapabilityResolver \| undefined` | no |  |
| resolveMediaAsset | property | `RuntimeMediaAssetResolver \| undefined` | no |  |
| resolveNodeProps | property | `RuntimeNodePropsResolver \| undefined` | no |  |
| resultSlots | property | `Readonly<Record<string, import("@ankhorage/contracts").SerializableValue \| undefined>> \| undefined` | no |  |
| stateAdapter | property | `StateAdapter \| undefined` | no |  |
| wrapNode | property | `((args: RuntimeRendererWrapArgs) => React.ReactNode) \| undefined` | no |  |
| writeResultSlot | property | `RuntimeBindingResultWriter \| undefined` | no |  |

## RuntimeRendererConfigProvider

Kind: `function`
Module: `src/RuntimeRendererConfig.tsx`
Source: `src/RuntimeRendererConfig.tsx:139:1`

### Signatures

- `(props: { value: RuntimeRendererConfig; children: React.ReactNode; }) => React.JSX.Element`
  - props: `{ value: RuntimeRendererConfig; children: React.ReactNode; }`
  - returns: `React.JSX.Element`

## RuntimeRendererProps

Kind: `type`
Module: `src/RuntimeRenderer.tsx`
Source: `src/RuntimeRenderer.tsx:55:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| bindingContext | property | `Record<string, unknown> \| undefined` | no |  |
| dataBindings | property | `ComponentDataBindingRegistry \| undefined` | no |  |
| dbAdapter | property | `DbAdapter \| undefined` | no |  |
| dbRealtimeAdapter | property | `DbRealtimeAdapter \| undefined` | no |  |
| disableActions | property | `boolean \| undefined` | no |  |
| executeCapability | property | `RuntimeCapabilityExecutor \| undefined` | no |  |
| isRoot | property | `boolean \| undefined` | no |  |
| mediaAssets | property | `MediaAssetRegistry \| undefined` | no |  |
| node | property | `UiNode` | yes |  |
| onDiagnostics | property | `((diagnostics: readonly DataSourceDiagnostic[]) => void) \| undefined` | no |  |
| registry | property | `Readonly<Record<string, React.ElementType<any, keyof React.JSX.IntrinsicElements>>> \| undefined` | no |  |
| resolveEventCapability | property | `RuntimeEventCapabilityResolver \| undefined` | no |  |
| resolveMediaAsset | property | `RuntimeMediaAssetResolver \| undefined` | no |  |
| resultSlots | property | `Readonly<Record<string, import("@ankhorage/contracts").SerializableValue \| undefined>> \| undefined` | no |  |
| stateAdapter | property | `StateAdapter \| undefined` | no |  |
| wrapNode | property | `((args: RuntimeRendererWrapArgs) => React.ReactNode) \| undefined` | no |  |

## RuntimeRendererWrapArgs

Kind: `type`
Module: `src/RuntimeRendererConfig.tsx`
Source: `src/RuntimeRendererConfig.tsx:31:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| isRoot | property | `boolean` | yes |  |
| node | property | `UiNode` | yes |  |
| rendered | property | `React.ReactNode` | yes |  |

## RuntimeResolvedMediaValue

Kind: `unknown`
Module: `src/runtimeMedia.ts`
Source: `src/runtimeMedia.ts:7:1`

## RuntimeResolveNodePropsArgs

Kind: `type`
Module: `node_modules/@ankhorage/contracts/dist/runtimeCallbacks.d.ts`
Source: `node_modules/@ankhorage/contracts/dist/runtimeCallbacks.d.ts:2:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| node | property | `UiNode` | yes |  |
| props | property | `Record<string, unknown>` | yes |  |

## RuntimeScreen

Kind: `function`
Module: `src/RuntimeScreen.tsx`
Source: `src/RuntimeScreen.tsx:20:1`

### Signatures

- `(props: RuntimeScreenProps) => React.JSX.Element`
  - props: `RuntimeScreenProps`
  - returns: `React.JSX.Element`

## RuntimeScreenOperationLoaderExecutionResult

Kind: `type`
Module: `src/runtimeScreenLoaders.ts`
Source: `src/runtimeScreenLoaders.ts:24:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| dependencyKey | property | `string` | yes |  |
| diagnostics | property | `readonly DataSourceDiagnostic[]` | yes |  |
| resultSlots | property | `Readonly<Record<string, import("@ankhorage/contracts").SerializableValue \| undefined>>` | yes |  |

## RuntimeScreenOperationLoaderState

Kind: `type`
Module: `src/runtimeScreenLoaders.ts`
Source: `src/runtimeScreenLoaders.ts:17:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| dependencyKey | property | `string` | yes |  |
| diagnostics | property | `readonly DataSourceDiagnostic[]` | yes |  |
| renderVersion | property | `number` | yes |  |
| resultSlots | property | `Readonly<Record<string, import("@ankhorage/contracts").SerializableValue \| undefined>>` | yes |  |

## RuntimeScreenProps

Kind: `type`
Module: `src/RuntimeScreen.tsx`
Source: `src/RuntimeScreen.tsx:13:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| manifest | property | `AppManifest` | yes |  |
| registry | property | `Readonly<Record<string, React.ElementType<any, keyof React.JSX.IntrinsicElements>>> \| undefined` | no |  |
| screen | property | `ScreenSpec` | yes |  |
| stateAdapter | property | `StateAdapter \| undefined` | no |  |

## shouldRenderRuntimeRepeatEmptyState

Kind: `function`
Module: `src/runtimeRepeatEmptyState.ts`
Source: `src/runtimeRepeatEmptyState.ts:3:1`

### Signatures

- `(args: { readonly diagnostics?: readonly DataSourceDiagnostic[]; readonly items?: readonly BindingValue[]; readonly status?: "pending" | "ready"; }) => boolean`
  - args: `{ readonly diagnostics?: readonly DataSourceDiagnostic[]; readonly items?: readonly BindingValue[]; readonly status?: "pending" | "ready"; }`
  - returns: `boolean`

## useManifest

Kind: `function`
Module: `src/ManifestContext.tsx`
Source: `src/ManifestContext.tsx:38:1`

Returns the active application manifest from the owning Runtime provider.

### Signatures

- `() => AppManifest`
  - returns: `AppManifest`

## useManifestContext

Kind: `function`
Module: `src/ManifestContext.tsx`
Source: `src/ManifestContext.tsx:47:1`

Returns the active manifest scope, including its application-lifetime state adapter.

### Signatures

- `() => ManifestContextValue`
  - returns: `ManifestContextValue`

## useOptionalManifestContext

Kind: `function`
Module: `src/ManifestContext.tsx`
Source: `src/ManifestContext.tsx:56:1`

Reads an enclosing manifest scope without requiring hosts to provide one.

### Signatures

- `() => ManifestContextValue | null`
  - returns: `ManifestContextValue | null`

## useRuntimeRendererConfig

Kind: `function`
Module: `src/RuntimeRendererConfig.tsx`
Source: `src/RuntimeRendererConfig.tsx:152:1`

### Signatures

- `() => RuntimeRendererConfig`
  - returns: `RuntimeRendererConfig`

## useRuntimeScreenOperationLoaders

Kind: `function`
Module: `src/runtimeScreenLoaders.ts`
Source: `src/runtimeScreenLoaders.ts:146:1`

Runs screen capability invocations when their serialized request input changes.

### Signatures

- `(args: { readonly bindingContext?: Record<string, unknown>; readonly executeCapability?: RuntimeCapabilityExecutor; readonly resultSlots?: RuntimeBindingResultCache; readonly onDiagnostics?: (diagnostics: readonly DataSourceDiagnostic[]) => void; readonly screen: ScreenSpec; }) => RuntimeScreenOperationLoaderState`
  - args: `{ readonly bindingContext?: Record<string, unknown>; readonly executeCapability?: RuntimeCapabilityExecutor; readonly resultSlots?: RuntimeBindingResultCache; readonly onDiagnostics?: (diagnostics: readonly DataSourceDiagnostic[]) => void; readonly screen: ScreenSpec; }`
  - returns: `RuntimeScreenOperationLoaderState`

## wrapRuntimeEventProps

Kind: `function`
Module: `src/runtimeActionRegistry.ts`
Source: `src/runtimeActionRegistry.ts:149:1`

Wraps component callbacks so manifest event bindings retain the original callback behavior.

### Signatures

- `(args: RuntimeEventPropWrapArgs) => Record<string, unknown>`
  - args: `RuntimeEventPropWrapArgs`
  - returns: `Record<string, unknown>`
