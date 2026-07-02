# Public API

## APP_EXTENSION_COMPONENT_REGISTRY

Kind: `value`
Module: `src/appExtensionRegistry.ts`
Source: `src/appExtensionRegistry.ts:6:14`

## ComponentRegistry

Kind: `unknown`
Module: `src/componentRegistry.ts`
Source: `src/componentRegistry.ts:3:1`

## composeRuntimeNodePropsResolver

Kind: `function`
Module: `src/RuntimeRendererConfig.tsx`
Source: `src/RuntimeRendererConfig.tsx:88:1`

### Signatures

- `(localResolver?: RuntimeNodePropsResolver | undefined, inheritedResolver?: RuntimeNodePropsResolver | undefined) => RuntimeNodePropsResolver | undefined`
  - inheritedResolver: `RuntimeNodePropsResolver | undefined` (optional)
  - localResolver: `RuntimeNodePropsResolver | undefined` (optional)
  - returns: `RuntimeNodePropsResolver | undefined`

## composeRuntimeRendererWrapNode

Kind: `function`
Module: `src/RuntimeRendererConfig.tsx`
Source: `src/RuntimeRendererConfig.tsx:73:1`

### Signatures

- `(innerWrapNode?: ((args: RuntimeRendererWrapArgs) => React.ReactNode) | undefined, outerWrapNode?: ((args: RuntimeRendererWrapArgs) => React.ReactNode) | undefined) => ((args: RuntimeRendererWrapArgs) => React.ReactNode) | undefined`
  - innerWrapNode: `((args: RuntimeRendererWrapArgs) => React.ReactNode) | undefined` (optional)
  - outerWrapNode: `((args: RuntimeRendererWrapArgs) => React.ReactNode) | undefined` (optional)
  - returns: `((args: RuntimeRendererWrapArgs) => React.ReactNode) | undefined`

## createComponentEventFromHandlerArgs

Kind: `function`
Module: `src/runtimeActionRegistry.ts`
Source: `src/runtimeActionRegistry.ts:217:1`

### Signatures

- `(args: { readonly node: UiNode; readonly eventName: string; readonly handlerArgs: readonly unknown[]; }) => ComponentEventDto<string, RuntimeEventPayload>`
  - args: `{ readonly node: UiNode; readonly eventName: string; readonly handlerArgs: readonly unknown[]; }`
  - returns: `ComponentEventDto<string, RuntimeEventPayload>`

## createComponentRegistry

Kind: `function`
Module: `src/componentRegistry.ts`
Source: `src/componentRegistry.ts:5:1`

### Signatures

- `(registries?: readonly ComponentRegistry[]) => ComponentRegistry`
  - registries: `readonly ComponentRegistry[]` (optional)
  - returns: `ComponentRegistry`

## createDbPersistActionHandler

Kind: `function`
Module: `src/runtimeDbPersist.ts`
Source: `src/runtimeDbPersist.ts:36:1`

### Signatures

- `(args: { readonly dbAdapter: DbAdapter; readonly onResult?: (result: RuntimeDbPersistExecutionResult) => void; }) => RuntimeActionHandler`
  - args: `{ readonly dbAdapter: DbAdapter; readonly onResult?: (result: RuntimeDbPersistExecutionResult) => void; }`
  - returns: `RuntimeActionHandler`

## createDbPersistAdapterError

Kind: `function`
Module: `src/runtimeDbPersist.ts`
Source: `src/runtimeDbPersist.ts:126:1`

### Signatures

- `(error: RuntimeDbPersistError) => DbAdapterError`
  - error: `RuntimeDbPersistError`
  - returns: `DbAdapterError`

## createPendingRuntimeScreenOperationLoaderState

Kind: `function`
Module: `src/runtimeScreenLoaders.ts`
Source: `src/runtimeScreenLoaders.ts:93:1`

### Signatures

- `(args: { readonly dependencyKey: string; readonly previousState?: RuntimeScreenOperationLoaderState; }) => RuntimeScreenOperationLoaderState`
  - args: `{ readonly dependencyKey: string; readonly previousState?: RuntimeScreenOperationLoaderState; }`
  - returns: `RuntimeScreenOperationLoaderState`

## createRuntimeActionRegistry

Kind: `function`
Module: `src/runtimeActionRegistry.ts`
Source: `src/runtimeActionRegistry.ts:67:1`

### Signatures

- `(options?: { actionHandlers?: RuntimeActionHandlers; dataSources?: DataSourceRegistry; dataBindings?: ComponentDataBindingRegistry; executeAction?: RuntimeActionHandler; executeOperation?: RuntimeBindingOperationExecutor; operationResults?: RuntimeBindingOperationResultCache; writeOperationResult?: RuntimeBindingOperationResultWriter; }) => RuntimeActionRegistry`
  - options: `{ actionHandlers?: RuntimeActionHandlers; dataSources?: DataSourceRegistry; dataBindings?: ComponentDataBindingRegistry; executeAction?: RuntimeActionHandler; executeOperation?: RuntimeBindingOperationExecutor; operationResults?: RuntimeBindingOperationResultCache; writeOperationResult?: RuntimeBindingOperationResultWriter; }` (optional)
  - returns: `RuntimeActionRegistry`

## createRuntimeBindingOperationKey

Kind: `function`
Module: `src/runtimeBindings.ts`
Source: `src/runtimeBindings.ts:163:1`

### Signatures

- `(operation: BindingOperationRef) => string`
  - operation: `BindingOperationRef`
  - returns: `string`

## createRuntimeDataSourceOperationExecutor

Kind: `function`
Module: `src/runtimeDataSourceOperations.ts`
Source: `src/runtimeDataSourceOperations.ts:12:1`

### Signatures

- `(options: RuntimeDataSourceOperationExecutorOptions) => RuntimeBindingOperationExecutor`
  - options: `RuntimeDataSourceOperationExecutorOptions`
  - returns: `RuntimeBindingOperationExecutor`

## createRuntimeManifest

Kind: `function`
Module: `src/runtimeManifest.ts`
Source: `src/runtimeManifest.ts:81:1`

### Signatures

- `(input: RuntimeManifestInput) => RuntimeManifest`
  - input: `RuntimeManifestInput`
  - returns: `RuntimeManifest`

## createRuntimeMemoryStateAdapter

Kind: `function`
Module: `src/runtimeStateAdapter.ts`
Source: `src/runtimeStateAdapter.ts:18:1`

### Signatures

- `(options?: RuntimeMemoryStateAdapterOptions) => StateAdapter`
  - options: `RuntimeMemoryStateAdapterOptions` (optional)
  - returns: `StateAdapter`

## createRuntimeScreenLoaderRequestKey

Kind: `function`
Module: `src/runtimeScreenLoaders.ts`
Source: `src/runtimeScreenLoaders.ts:60:1`

### Signatures

- `(args: { readonly screenId: string; readonly loaders: readonly OperationScreenDataLoaderDefinition[]; readonly bindingContext?: Record<string, unknown>; readonly operationResults?: RuntimeBindingOperationResultCache; }) => string`
  - args: `{ readonly screenId: string; readonly loaders: readonly OperationScreenDataLoaderDefinition[]; readonly bindingContext?: Record<string, unknown>; readonly operationResults?: RuntimeBindingOperationResultCache; }`
  - returns: `string`

## defineRuntimeAction

Kind: `function`
Module: `src/runtimeManifest.ts`
Source: `src/runtimeManifest.ts:63:1`

### Signatures

- `(action: RuntimeActionDescriptor<Data>) => RuntimeActionDescriptor<Data>`
  - action: `RuntimeActionDescriptor<Data>`
  - returns: `RuntimeActionDescriptor<Data>`

## defineRuntimeAdapter

Kind: `function`
Module: `src/runtimeManifest.ts`
Source: `src/runtimeManifest.ts:69:1`

### Signatures

- `(adapter: RuntimeAdapterDescriptor<Options>) => RuntimeAdapterDescriptor<Options>`
  - adapter: `RuntimeAdapterDescriptor<Options>`
  - returns: `RuntimeAdapterDescriptor<Options>`

## defineRuntimeBinding

Kind: `function`
Module: `src/runtimeManifest.ts`
Source: `src/runtimeManifest.ts:75:1`

### Signatures

- `(binding: RuntimeBindingDescriptor<Value>) => RuntimeBindingDescriptor<Value>`
  - binding: `RuntimeBindingDescriptor<Value>`
  - returns: `RuntimeBindingDescriptor<Value>`

## dispatchRuntimeComponentEvent

Kind: `function`
Module: `src/runtimeActionRegistry.ts`
Source: `src/runtimeActionRegistry.ts:103:1`

### Signatures

- `(args: RuntimeComponentEventDispatchArgs & { readonly actionHandlers?: RuntimeActionHandlers; }) => Promise<readonly DataSourceDiagnostic[]>`
  - args: `RuntimeComponentEventDispatchArgs & { readonly actionHandlers?: RuntimeActionHandlers; }`
  - returns: `Promise<readonly DataSourceDiagnostic[]>`

## dispatchRuntimeComponentEventWithReporting

Kind: `function`
Module: `src/runtimeEventExecution.ts`
Source: `src/runtimeEventExecution.ts:14:1`

### Signatures

- `(args: RuntimeComponentEventDispatchArgs & RuntimeEventDiagnosticsReporter & { readonly actionHandlers?: RuntimeActionHandlers; }) => Promise<readonly DataSourceDiagnostic[]>`
  - args: `RuntimeComponentEventDispatchArgs & RuntimeEventDiagnosticsReporter & { readonly actionHandlers?: RuntimeActionHandlers; }`
  - returns: `Promise<readonly DataSourceDiagnostic[]>`

## executeDbPersistAction

Kind: `function`
Module: `src/runtimeDbPersist.ts`
Source: `src/runtimeDbPersist.ts:48:1`

### Signatures

- `(args: { readonly dbAdapter: DbAdapter; readonly handlerArgs: RuntimeActionHandlerArgs; }) => Promise<RuntimeDbPersistExecutionResult>`
  - args: `{ readonly dbAdapter: DbAdapter; readonly handlerArgs: RuntimeActionHandlerArgs; }`
  - returns: `Promise<RuntimeDbPersistExecutionResult>`

## executeRuntimeAction

Kind: `function`
Module: `src/runtimeActions.ts`
Source: `src/runtimeActions.ts:39:1`

### Signatures

- `(args: { action: unknown; router: RouterLike; mode: "light" | "dark"; setMode: (mode: "light" | "dark") => void; actionHandlers?: RuntimeActionHandlers; requestAnimationFrameImpl?: typeof requestAnimationFrame; alertImpl?: typeof alert; consoleImpl?: Pick<typeof console, "log">; }) => Promise<void>`
  - args: `{ action: unknown; router: RouterLike; mode: "light" | "dark"; setMode: (mode: "light" | "dark") => void; actionHandlers?: RuntimeActionHandlers; requestAnimationFrameImpl?: typeof requestAnimationFrame; alertImpl?: typeof alert; consoleImpl?: Pick<typeof console, "log">; }`
  - returns: `Promise<void>`

## executeRuntimeApiLoaders

Kind: `function`
Module: `src/runtimeApiLoaders.ts`
Source: `src/runtimeApiLoaders.ts:100:1`

### Signatures

- `(args: { readonly data?: AppDataManifest; readonly loaders: readonly RuntimeApiLoaderDefinition[]; readonly stateAdapter: StateAdapter; }) => RuntimeApiLoaderExecutionResult`
  - args: `{ readonly data?: AppDataManifest; readonly loaders: readonly RuntimeApiLoaderDefinition[]; readonly stateAdapter: StateAdapter; }`
  - returns: `RuntimeApiLoaderExecutionResult`

## executeRuntimeScreenOperationLoaders

Kind: `function`
Module: `src/runtimeScreenLoaders.ts`
Source: `src/runtimeScreenLoaders.ts:189:1`

### Signatures

- `(args: { readonly bindingContext?: Record<string, unknown>; readonly dataSources?: RuntimeBindingResolutionContext["dataSources"]; readonly executeOperation?: RuntimeBindingOperationExecutor; readonly operationResults?: RuntimeBindingOperationResultCache; readonly screen: ScreenSpec; readonly loaders: readonly OperationScreenDataLoaderDefinition[]; }) => Promise<RuntimeScreenOperationLoaderExecutionResult>`
  - args: `{ readonly bindingContext?: Record<string, unknown>; readonly dataSources?: RuntimeBindingResolutionContext["dataSources"]; readonly executeOperation?: RuntimeBindingOperationExecutor; readonly operationResults?: RuntimeBindingOperationResultCache; readonly screen: ScreenSpec; readonly loaders: readonly OperationScreenDataLoaderDefinition[]; }`
  - returns: `Promise<RuntimeScreenOperationLoaderExecutionResult>`

## listRuntimeCapabilities

Kind: `function`
Module: `src/runtimeManifest.ts`
Source: `src/runtimeManifest.ts:93:1`

### Signatures

- `() => readonly ("runtime.render" | "runtime.actions" | "runtime.bindings" | "runtime.adapters")[]`
  - returns: `readonly ("runtime.render" | "runtime.actions" | "runtime.bindings" | "runtime.adapters")[]`

## ManifestContext

Kind: `value`
Module: `src/ManifestContext.tsx`
Source: `src/ManifestContext.tsx:10:14`

## ManifestProvider

Kind: `function`
Module: `src/ManifestContext.tsx`
Source: `src/ManifestContext.tsx:12:1`

### Signatures

- `(props: ManifestContextValue & { children: React.ReactNode; }) => React.JSX.Element`
  - props: `ManifestContextValue & { children: React.ReactNode; }`
  - returns: `React.JSX.Element`

## materializeRuntimeApiLoaderState

Kind: `function`
Module: `src/runtimeApiLoaders.ts`
Source: `src/runtimeApiLoaders.ts:40:1`

### Signatures

- `(args: { readonly data?: AppDataManifest; readonly loaders: readonly RuntimeApiLoaderDefinition[]; }) => RuntimeApiLoaderMaterializationResult`
  - args: `{ readonly data?: AppDataManifest; readonly loaders: readonly RuntimeApiLoaderDefinition[]; }`
  - returns: `RuntimeApiLoaderMaterializationResult`

## mergeRuntimeRendererConfig

Kind: `function`
Module: `src/RuntimeRendererConfig.tsx`
Source: `src/RuntimeRendererConfig.tsx:106:1`

### Signatures

- `(localConfig: RuntimeRendererConfig | undefined, inheritedConfig: RuntimeRendererConfig | undefined) => RuntimeRendererConfig`
  - inheritedConfig: `RuntimeRendererConfig | undefined`
  - localConfig: `RuntimeRendererConfig | undefined`
  - returns: `RuntimeRendererConfig`

## resolveBindingInputMap

Kind: `function`
Module: `src/runtimeBindings.ts`
Source: `src/runtimeBindings.ts:129:1`

### Signatures

- `(input: Readonly<Record<string, BindingInputValue>> | undefined, context: RuntimeBindingResolutionContext, diagnostics?: DataSourceDiagnostic[]) => Promise<BindingValue | undefined>`
  - context: `RuntimeBindingResolutionContext`
  - diagnostics: `DataSourceDiagnostic[]` (optional)
  - input: `Readonly<Record<string, BindingInputValue>> | undefined`
  - returns: `Promise<BindingValue | undefined>`

## resolveDbPersistInput

Kind: `function`
Module: `src/runtimeDbPersist.ts`
Source: `src/runtimeDbPersist.ts:68:1`

### Signatures

- `(payload: object | undefined) => { readonly ok: true; readonly data: DbInsertInput; } | { readonly ok: false; readonly error: RuntimeDbPersistError; }`
  - payload: `object | undefined`
  - returns: `{ readonly ok: true; readonly data: DbInsertInput; } | { readonly ok: false; readonly error: RuntimeDbPersistError; }`

## resolveRuntimeActionPayload

Kind: `function`
Module: `src/runtimeActionRegistry.ts`
Source: `src/runtimeActionRegistry.ts:231:1`

### Signatures

- `(payload: object | undefined, args: RuntimeActionResolutionArgs) => object | undefined`
  - args: `RuntimeActionResolutionArgs`
  - payload: `object | undefined`
  - returns: `object | undefined`

## resolveRuntimeActionValue

Kind: `function`
Module: `src/runtimeActionRegistry.ts`
Source: `src/runtimeActionRegistry.ts:242:1`

### Signatures

- `(value: unknown, args: RuntimeActionResolutionArgs) => object | undefined`
  - args: `RuntimeActionResolutionArgs`
  - value: `unknown`
  - returns: `object | undefined`

## resolveRuntimeBindings

Kind: `function`
Module: `src/runtimeBindings.ts`
Source: `src/runtimeBindings.ts:89:1`

### Signatures

- `(args: RuntimeBindingResolutionArgs) => RuntimeBindingResolutionResult`
  - args: `RuntimeBindingResolutionArgs`
  - returns: `RuntimeBindingResolutionResult`

## resolveRuntimeBindingsAsync

Kind: `function`
Module: `src/runtimeBindings.ts`
Source: `src/runtimeBindings.ts:74:1`

### Signatures

- `(args: RuntimeBindingResolutionArgs) => Promise<RuntimeBindingResolutionResult>`
  - args: `RuntimeBindingResolutionArgs`
  - returns: `Promise<RuntimeBindingResolutionResult>`

## resolveRuntimeBindingValue

Kind: `function`
Module: `src/runtimeBindings.ts`
Source: `src/runtimeBindings.ts:103:1`

### Signatures

- `(binding: PropBinding, context: RuntimeBindingResolutionContext, diagnostics?: DataSourceDiagnostic[]) => Promise<unknown>`
  - binding: `PropBinding`
  - context: `RuntimeBindingResolutionContext`
  - diagnostics: `DataSourceDiagnostic[]` (optional)
  - returns: `Promise<unknown>`

## resolveRuntimeBindingValueSync

Kind: `function`
Module: `src/runtimeBindings.ts`
Source: `src/runtimeBindings.ts:116:1`

### Signatures

- `(binding: PropBinding, context: RuntimeBindingResolutionContext, diagnostics?: DataSourceDiagnostic[]) => unknown`
  - binding: `PropBinding`
  - context: `RuntimeBindingResolutionContext`
  - diagnostics: `DataSourceDiagnostic[]` (optional)
  - returns: `unknown`

## resolveScreenApiLoaders

Kind: `function`
Module: `src/runtimeScreenLoaders.ts`
Source: `src/runtimeScreenLoaders.ts:44:1`

### Signatures

- `(screen: ScreenSpec) => readonly ApiScreenDataLoaderDefinition[]`
  - screen: `ScreenSpec`
  - returns: `readonly ApiScreenDataLoaderDefinition[]`

## resolveScreenOperationLoaders

Kind: `function`
Module: `src/runtimeScreenLoaders.ts`
Source: `src/runtimeScreenLoaders.ts:52:1`

### Signatures

- `(screen: ScreenSpec) => readonly OperationScreenDataLoaderDefinition[]`
  - screen: `ScreenSpec`
  - returns: `readonly OperationScreenDataLoaderDefinition[]`

## RUNTIME_CAPABILITIES

Kind: `value`
Module: `src/runtimeManifest.ts`
Source: `src/runtimeManifest.ts:1:14`

## RUNTIME_MANIFEST_KIND

Kind: `value`
Module: `src/runtimeManifest.ts`
Source: `src/runtimeManifest.ts:8:14`

## RuntimeAction

Kind: `unknown`
Module: `src/RuntimeRendererConfig.tsx`
Source: `src/RuntimeRendererConfig.tsx:43:1`

## RuntimeActionDescriptor

Kind: `type`
Module: `src/runtimeManifest.ts`
Source: `src/runtimeManifest.ts:24:1`

### Members

| Name        | Kind     | Type                                                                                             | Required | Description |
| ----------- | -------- | ------------------------------------------------------------------------------------------------ | -------- | ----------- |
| capability  | property | `"runtime.render" \| "runtime.actions" \| "runtime.bindings" \| "runtime.adapters" \| undefined` | no       |             |
| data        | property | `Data \| undefined`                                                                              | no       |             |
| description | property | `string \| undefined`                                                                            | no       |             |
| id          | property | `string`                                                                                         | yes      |             |

## RuntimeActionExecutor

Kind: `unknown`
Module: `src/RuntimeRendererConfig.tsx`
Source: `src/RuntimeRendererConfig.tsx:46:1`

## RuntimeActionHandler

Kind: `unknown`
Module: `src/RuntimeRendererConfig.tsx`
Source: `src/RuntimeRendererConfig.tsx:44:1`

## RuntimeActionHandlerArgs

Kind: `type`
Module: `src/RuntimeRendererConfig.tsx`
Source: `src/RuntimeRendererConfig.tsx:36:1`

### Members

| Name            | Kind     | Type                                             | Required | Description |
| --------------- | -------- | ------------------------------------------------ | -------- | ----------- |
| action          | property | `RuntimeAction`                                  | yes      |             |
| event           | property | `ComponentEventDto<string, object> \| undefined` | no       |             |
| node            | property | `UiNode \| undefined`                            | no       |             |
| resolvedPayload | property | `object \| undefined`                            | no       |             |

## RuntimeActionHandlers

Kind: `unknown`
Module: `src/RuntimeRendererConfig.tsx`
Source: `src/RuntimeRendererConfig.tsx:45:1`

## RuntimeActionRegistry

Kind: `type`
Module: `src/runtimeActionRegistry.ts`
Source: `src/runtimeActionRegistry.ts:31:1`

### Members

| Name                   | Kind   | Type                                                          | Required | Description |
| ---------------------- | ------ | ------------------------------------------------------------- | -------- | ----------- |
| dispatchComponentEvent | method | `(args: RuntimeComponentEventDispatchArgs) => Promise<void>`  | yes      |             |
| registerActionHandler  | method | `(type: string, handler: RuntimeActionHandler) => () => void` | yes      |             |

## RuntimeActionResolutionArgs

Kind: `type`
Module: `src/runtimeActionRegistry.ts`
Source: `src/runtimeActionRegistry.ts:42:1`

### Members

| Name             | Kind     | Type                                                               | Required | Description |
| ---------------- | -------- | ------------------------------------------------------------------ | -------- | ----------- |
| context          | property | `Record<string, unknown> \| undefined`                             | no       |             |
| event            | property | `ComponentEventDto<string, object>`                                | yes      |             |
| operationResults | property | `Readonly<Record<string, BindingValue \| undefined>> \| undefined` | no       |             |
| state            | property | `Record<string, unknown> \| undefined`                             | no       |             |

## RuntimeActionResolutionScope

Kind: `type`
Module: `src/runtimeActionRegistry.ts`
Source: `src/runtimeActionRegistry.ts:36:1`

### Members

| Name             | Kind     | Type                                                               | Required | Description |
| ---------------- | -------- | ------------------------------------------------------------------ | -------- | ----------- |
| context          | property | `Record<string, unknown> \| undefined`                             | no       |             |
| operationResults | property | `Readonly<Record<string, BindingValue \| undefined>> \| undefined` | no       |             |
| state            | property | `Record<string, unknown> \| undefined`                             | no       |             |

## RuntimeAdapterDescriptor

Kind: `type`
Module: `src/runtimeManifest.ts`
Source: `src/runtimeManifest.ts:39:1`

### Members

| Name    | Kind     | Type                   | Required | Description |
| ------- | -------- | ---------------------- | -------- | ----------- |
| id      | property | `string`               | yes      |             |
| kind    | property | `string`               | yes      |             |
| options | property | `Options \| undefined` | no       |             |

## RuntimeApiLoaderDefinition

Kind: `unknown`
Module: `src/runtimeApiLoaders.ts`
Source: `src/runtimeApiLoaders.ts:17:1`

## RuntimeApiLoaderDiagnostic

Kind: `type`
Module: `src/runtimeApiLoaders.ts`
Source: `src/runtimeApiLoaders.ts:19:1`

### Members

| Name       | Kind     | Type                                                                                                       | Required | Description |
| ---------- | -------- | ---------------------------------------------------------------------------------------------------------- | -------- | ----------- |
| apiId      | property | `string \| undefined`                                                                                      | no       |             |
| code       | property | `"invalid-record" \| "missing-api" \| "missing-target-path" \| "state-set-failed" \| "unsupported-loader"` | yes      |             |
| message    | property | `string`                                                                                                   | yes      |             |
| targetPath | property | `string \| undefined`                                                                                      | no       |             |

## RuntimeApiLoaderExecutionResult

Kind: `type`
Module: `src/runtimeApiLoaders.ts`
Source: `src/runtimeApiLoaders.ts:31:1`

### Members

| Name        | Kind     | Type                                    | Required | Description |
| ----------- | -------- | --------------------------------------- | -------- | ----------- |
| diagnostics | property | `readonly RuntimeApiLoaderDiagnostic[]` | yes      |             |

## RuntimeApiLoaderMaterializationResult

Kind: `type`
Module: `src/runtimeApiLoaders.ts`
Source: `src/runtimeApiLoaders.ts:35:1`

### Members

| Name        | Kind     | Type                                    | Required | Description |
| ----------- | -------- | --------------------------------------- | -------- | ----------- |
| diagnostics | property | `readonly RuntimeApiLoaderDiagnostic[]` | yes      |             |
| state       | property | `Readonly<Record<string, StateValue>>`  | yes      |             |

## RuntimeApiLoaderMode

Kind: `unknown`
Module: `src/runtimeApiLoaders.ts`
Source: `src/runtimeApiLoaders.ts:15:1`

## RuntimeBindingDescriptor

Kind: `type`
Module: `src/runtimeManifest.ts`
Source: `src/runtimeManifest.ts:31:1`

### Members

| Name     | Kind     | Type                  | Required | Description |
| -------- | -------- | --------------------- | -------- | ----------- |
| actionId | property | `string \| undefined` | no       |             |
| id       | property | `string`              | yes      |             |
| source   | property | `string`              | yes      |             |
| target   | property | `string`              | yes      |             |
| value    | property | `Value \| undefined`  | no       |             |

## RuntimeBindingOperationExecutionArgs

Kind: `type`
Module: `src/runtimeBindings.ts`
Source: `src/runtimeBindings.ts:22:1`

### Members

| Name       | Kind     | Type                              | Required | Description |
| ---------- | -------- | --------------------------------- | -------- | ----------- |
| dataSource | property | `DataSourceConfig`                | yes      |             |
| endpoint   | property | `DataEndpointConfig \| undefined` | no       |             |
| input      | property | `BindingValue \| undefined`       | no       |             |
| node       | property | `UiNode \| undefined`             | no       |             |
| operation  | property | `BindingOperationRef`             | yes      |             |

## RuntimeBindingOperationExecutionResult

Kind: `unknown`
Module: `src/runtimeBindings.ts`
Source: `src/runtimeBindings.ts:30:1`

## RuntimeBindingOperationExecutor

Kind: `unknown`
Module: `src/runtimeBindings.ts`
Source: `src/runtimeBindings.ts:41:1`

## RuntimeBindingOperationKey

Kind: `unknown`
Module: `src/runtimeBindings.ts`
Source: `src/runtimeBindings.ts:20:1`

## RuntimeBindingOperationResultCache

Kind: `unknown`
Module: `src/runtimeBindings.ts`
Source: `src/runtimeBindings.ts:45:1`

## RuntimeBindingOperationResultWriter

Kind: `unknown`
Module: `src/runtimeBindings.ts`
Source: `src/runtimeBindings.ts:49:1`

## RuntimeBindingResolutionArgs

Kind: `type`
Module: `src/runtimeBindings.ts`
Source: `src/runtimeBindings.ts:64:1`

### Members

| Name             | Kind     | Type                                                                                                                                                     | Required | Description |
| ---------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ----------- |
| context          | property | `Record<string, unknown> \| undefined`                                                                                                                   | no       |             |
| dataBindings     | property | `Readonly<Record<string, import("/Users/a_rtiphishl_e/git/runtime/node_modules/@ankhorage/contracts/dist/bindings").ComponentDataBinding>> \| undefined` | no       |             |
| dataSources      | property | `Readonly<Record<string, DataSourceConfig>> \| undefined`                                                                                                | no       |             |
| event            | property | `ComponentEventDto<string, object> \| undefined`                                                                                                         | no       |             |
| executeOperation | property | `RuntimeBindingOperationExecutor \| undefined`                                                                                                           | no       |             |
| node             | property | `UiNode`                                                                                                                                                 | yes      |             |
| operationResults | property | `Readonly<Record<string, BindingValue \| undefined>> \| undefined`                                                                                       | no       |             |
| props            | property | `Record<string, unknown>`                                                                                                                                | yes      |             |
| stateAdapter     | property | `StateAdapter \| undefined`                                                                                                                              | no       |             |

## RuntimeBindingResolutionContext

Kind: `type`
Module: `src/runtimeBindings.ts`
Source: `src/runtimeBindings.ts:54:1`

### Members

| Name             | Kind     | Type                                                                                                                                                     | Required | Description |
| ---------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ----------- |
| context          | property | `Record<string, unknown> \| undefined`                                                                                                                   | no       |             |
| dataBindings     | property | `Readonly<Record<string, import("/Users/a_rtiphishl_e/git/runtime/node_modules/@ankhorage/contracts/dist/bindings").ComponentDataBinding>> \| undefined` | no       |             |
| dataSources      | property | `Readonly<Record<string, DataSourceConfig>> \| undefined`                                                                                                | no       |             |
| event            | property | `ComponentEventDto<string, object> \| undefined`                                                                                                         | no       |             |
| executeOperation | property | `RuntimeBindingOperationExecutor \| undefined`                                                                                                           | no       |             |
| operationResults | property | `Readonly<Record<string, BindingValue \| undefined>> \| undefined`                                                                                       | no       |             |
| stateAdapter     | property | `StateAdapter \| undefined`                                                                                                                              | no       |             |

## RuntimeBindingResolutionResult

Kind: `type`
Module: `src/runtimeBindings.ts`
Source: `src/runtimeBindings.ts:69:1`

### Members

| Name        | Kind     | Type                              | Required | Description |
| ----------- | -------- | --------------------------------- | -------- | ----------- |
| diagnostics | property | `readonly DataSourceDiagnostic[]` | yes      |             |
| props       | property | `Record<string, unknown>`         | yes      |             |

## RuntimeCapability

Kind: `unknown`
Module: `src/runtimeManifest.ts`
Source: `src/runtimeManifest.ts:10:1`

## RuntimeComponentEventDispatchArgs

Kind: `type`
Module: `src/runtimeActionRegistry.ts`
Source: `src/runtimeActionRegistry.ts:46:1`

### Members

| Name                 | Kind     | Type                                                                                                                                                     | Required | Description |
| -------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ----------- |
| context              | property | `Record<string, unknown> \| undefined`                                                                                                                   | no       |             |
| dataBindings         | property | `Readonly<Record<string, import("/Users/a_rtiphishl_e/git/runtime/node_modules/@ankhorage/contracts/dist/bindings").ComponentDataBinding>> \| undefined` | no       |             |
| dataSources          | property | `Readonly<Record<string, DataSourceConfig>> \| undefined`                                                                                                | no       |             |
| event                | property | `ComponentEventDto<string, object>`                                                                                                                      | yes      |             |
| eventName            | property | `string \| undefined`                                                                                                                                    | no       |             |
| executeAction        | property | `RuntimeActionHandler \| undefined`                                                                                                                      | no       |             |
| executeOperation     | property | `RuntimeBindingOperationExecutor \| undefined`                                                                                                           | no       |             |
| node                 | property | `UiNode`                                                                                                                                                 | yes      |             |
| operationResults     | property | `Readonly<Record<string, BindingValue \| undefined>> \| undefined`                                                                                       | no       |             |
| state                | property | `Record<string, unknown> \| undefined`                                                                                                                   | no       |             |
| writeOperationResult | property | `RuntimeBindingOperationResultWriter \| undefined`                                                                                                       | no       |             |

## RuntimeDataSourceOperationExecutorOptions

Kind: `type`
Module: `src/runtimeDataSourceOperations.ts`
Source: `src/runtimeDataSourceOperations.ts:7:1`

### Members

| Name               | Kind     | Type                                          | Required | Description |
| ------------------ | -------- | --------------------------------------------- | -------- | ----------- |
| credentialResolver | property | `EndpointTestCredentialResolver \| undefined` | no       |             |
| fetch              | property | `EndpointTestFetch`                           | yes      |             |

## RuntimeDbPersistError

Kind: `type`
Module: `src/runtimeDbPersist.ts`
Source: `src/runtimeDbPersist.ts:16:1`

### Members

| Name    | Kind     | Type     | Required | Description |
| ------- | -------- | -------- | -------- | ----------- |
| code    | property | `string` | yes      |             |
| message | property | `string` | yes      |             |

## RuntimeDbPersistExecutionResult

Kind: `unknown`
Module: `src/runtimeDbPersist.ts`
Source: `src/runtimeDbPersist.ts:21:1`

## RuntimeDbPersistResult

Kind: `type`
Module: `src/runtimeDbPersist.ts`
Source: `src/runtimeDbPersist.ts:11:1`

### Members

| Name   | Kind     | Type                      | Required | Description |
| ------ | -------- | ------------------------- | -------- | ----------- |
| input  | property | `DbInsertInput<DbRecord>` | yes      |             |
| result | property | `DbResult<DbRecord[]>`    | yes      |             |

## RuntimeDiagnostic

Kind: `type`
Module: `src/runtimeManifest.ts`
Source: `src/runtimeManifest.ts:12:1`

### Members

| Name     | Kind     | Type                             | Required | Description |
| -------- | -------- | -------------------------------- | -------- | ----------- |
| code     | property | `string`                         | yes      |             |
| message  | property | `string`                         | yes      |             |
| severity | property | `"error" \| "info" \| "warning"` | yes      |             |

## RuntimeEventDiagnosticsReporter

Kind: `type`
Module: `src/runtimeEventExecution.ts`
Source: `src/runtimeEventExecution.ts:9:1`

### Members

| Name          | Kind     | Type                                                                    | Required | Description |
| ------------- | -------- | ----------------------------------------------------------------------- | -------- | ----------- |
| consoleImpl   | property | `Pick<Console, "error" \| "warn"> \| undefined`                         | no       |             |
| onDiagnostics | property | `((diagnostics: readonly DataSourceDiagnostic[]) => void) \| undefined` | no       |             |

## RuntimeEventPropWrapArgs

Kind: `type`
Module: `src/runtimeActionRegistry.ts`
Source: `src/runtimeActionRegistry.ts:57:1`

### Members

| Name                   | Kind     | Type                                                                                                                                                     | Required | Description |
| ---------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ----------- |
| context                | property | `Record<string, unknown> \| undefined`                                                                                                                   | no       |             |
| dataBindings           | property | `Readonly<Record<string, import("/Users/a_rtiphishl_e/git/runtime/node_modules/@ankhorage/contracts/dist/bindings").ComponentDataBinding>> \| undefined` | no       |             |
| disableActions         | property | `boolean`                                                                                                                                                | yes      |             |
| dispatchComponentEvent | property | `(args: RuntimeComponentEventDispatchArgs) => Promise<void> \| void`                                                                                     | yes      |             |
| node                   | property | `UiNode`                                                                                                                                                 | yes      |             |
| operationResults       | property | `Readonly<Record<string, BindingValue \| undefined>> \| undefined`                                                                                       | no       |             |
| props                  | property | `Record<string, unknown>`                                                                                                                                | yes      |             |
| state                  | property | `Record<string, unknown> \| undefined`                                                                                                                   | no       |             |

## RuntimeManifest

Kind: `type`
Module: `src/runtimeManifest.ts`
Source: `src/runtimeManifest.ts:45:1`

### Members

| Name        | Kind     | Type                                           | Required | Description |
| ----------- | -------- | ---------------------------------------------- | -------- | ----------- |
| actions     | property | `readonly RuntimeActionDescriptor<unknown>[]`  | yes      |             |
| adapters    | property | `readonly RuntimeAdapterDescriptor<unknown>[]` | yes      |             |
| bindings    | property | `readonly RuntimeBindingDescriptor<unknown>[]` | yes      |             |
| config      | property | `RuntimeManifestConfig`                        | yes      |             |
| diagnostics | property | `readonly RuntimeDiagnostic[]`                 | yes      |             |
| kind        | property | `"ankhorage-runtime-manifest"`                 | yes      |             |
| version     | property | `1`                                            | yes      |             |

## RuntimeManifestConfig

Kind: `type`
Module: `src/runtimeManifest.ts`
Source: `src/runtimeManifest.ts:18:1`

### Members

| Name        | Kind     | Type                                             | Required | Description |
| ----------- | -------- | ------------------------------------------------ | -------- | ----------- |
| appId       | property | `string`                                         | yes      |             |
| environment | property | `string \| undefined`                            | no       |             |
| values      | property | `Readonly<Record<string, unknown>> \| undefined` | no       |             |

## RuntimeManifestInput

Kind: `type`
Module: `src/runtimeManifest.ts`
Source: `src/runtimeManifest.ts:55:1`

### Members

| Name        | Kind     | Type                                                        | Required | Description |
| ----------- | -------- | ----------------------------------------------------------- | -------- | ----------- |
| actions     | property | `readonly RuntimeActionDescriptor<unknown>[] \| undefined`  | no       |             |
| adapters    | property | `readonly RuntimeAdapterDescriptor<unknown>[] \| undefined` | no       |             |
| bindings    | property | `readonly RuntimeBindingDescriptor<unknown>[] \| undefined` | no       |             |
| config      | property | `RuntimeManifestConfig`                                     | yes      |             |
| diagnostics | property | `readonly RuntimeDiagnostic[] \| undefined`                 | no       |             |

## RuntimeMemoryStateAdapterOptions

Kind: `type`
Module: `src/runtimeStateAdapter.ts`
Source: `src/runtimeStateAdapter.ts:14:1`

### Members

| Name         | Kind     | Type                                                | Required | Description |
| ------------ | -------- | --------------------------------------------------- | -------- | ----------- |
| initialState | property | `Readonly<Record<string, StateValue>> \| undefined` | no       |             |

## RuntimeNodePropsResolver

Kind: `unknown`
Module: `src/RuntimeRendererConfig.tsx`
Source: `src/RuntimeRendererConfig.tsx:32:1`

## RuntimeRenderer

Kind: `function`
Module: `src/RuntimeRenderer.tsx`
Source: `src/RuntimeRenderer.tsx:68:1`

### Signatures

- `(props: RuntimeRendererProps) => React.JSX.Element`
  - props: `RuntimeRendererProps`
  - returns: `React.JSX.Element`

## RuntimeRendererConfig

Kind: `type`
Module: `src/RuntimeRendererConfig.tsx`
Source: `src/RuntimeRendererConfig.tsx:48:1`

### Members

| Name                 | Kind     | Type                                                                                                                                                          | Required | Description |
| -------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ----------- |
| actionHandlers       | property | `RuntimeActionHandlers \| undefined`                                                                                                                          | no       |             |
| bindingContext       | property | `Record<string, unknown> \| undefined`                                                                                                                        | no       |             |
| dataBindings         | property | `Readonly<Record<string, import("/Users/a_rtiphishl_e/git/runtime/node_modules/@ankhorage/contracts/dist/bindings").ComponentDataBinding>> \| undefined`      | no       |             |
| dataSources          | property | `Readonly<Record<string, import("/Users/a_rtiphishl_e/git/runtime/node_modules/@ankhorage/contracts/dist/index").DataSourceConfig>> \| undefined`             | no       |             |
| dbAdapter            | property | `DbAdapter \| undefined`                                                                                                                                      | no       |             |
| dbRealtimeAdapter    | property | `DbRealtimeAdapter \| undefined`                                                                                                                              | no       |             |
| disableActions       | property | `boolean \| undefined`                                                                                                                                        | no       |             |
| executeAction        | property | `RuntimeActionHandler \| undefined`                                                                                                                           | no       |             |
| executeOperation     | property | `RuntimeBindingOperationExecutor \| undefined`                                                                                                                | no       |             |
| onDiagnostics        | property | `((diagnostics: readonly DataSourceDiagnostic[]) => void) \| undefined`                                                                                       | no       |             |
| operationResults     | property | `Readonly<Record<string, import("/Users/a_rtiphishl_e/git/runtime/node_modules/@ankhorage/contracts/dist/bindings").BindingValue \| undefined>> \| undefined` | no       |             |
| registry             | property | `ComponentRegistry \| undefined`                                                                                                                              | no       |             |
| resolveNodeProps     | property | `RuntimeNodePropsResolver \| undefined`                                                                                                                       | no       |             |
| stateAdapter         | property | `StateAdapter \| undefined`                                                                                                                                   | no       |             |
| wrapNode             | property | `((args: RuntimeRendererWrapArgs) => React.ReactNode) \| undefined`                                                                                           | no       |             |
| writeOperationResult | property | `RuntimeBindingOperationResultWriter \| undefined`                                                                                                            | no       |             |

## RuntimeRendererConfigProvider

Kind: `function`
Module: `src/RuntimeRendererConfig.tsx`
Source: `src/RuntimeRendererConfig.tsx:152:1`

### Signatures

- `(props: { value: RuntimeRendererConfig; children: React.ReactNode; }) => React.JSX.Element`
  - props: `{ value: RuntimeRendererConfig; children: React.ReactNode; }`
  - returns: `React.JSX.Element`

## RuntimeRendererProps

Kind: `type`
Module: `src/RuntimeRenderer.tsx`
Source: `src/RuntimeRenderer.tsx:50:1`

### Members

| Name              | Kind     | Type                                                                                                                                                     | Required | Description |
| ----------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ----------- |
| bindingContext    | property | `Record<string, unknown> \| undefined`                                                                                                                   | no       |             |
| dataBindings      | property | `Readonly<Record<string, import("/Users/a_rtiphishl_e/git/runtime/node_modules/@ankhorage/contracts/dist/bindings").ComponentDataBinding>> \| undefined` | no       |             |
| dataSources       | property | `Readonly<Record<string, import("/Users/a_rtiphishl_e/git/runtime/node_modules/@ankhorage/contracts/dist/index").DataSourceConfig>> \| undefined`        | no       |             |
| dbAdapter         | property | `DbAdapter \| undefined`                                                                                                                                 | no       |             |
| dbRealtimeAdapter | property | `DbRealtimeAdapter \| undefined`                                                                                                                         | no       |             |
| disableActions    | property | `boolean \| undefined`                                                                                                                                   | no       |             |
| executeAction     | property | `import("/Users/a_rtiphishl_e/git/runtime/src/RuntimeRendererConfig").RuntimeActionHandler \| undefined`                                                 | no       |             |
| executeOperation  | property | `RuntimeBindingOperationExecutor \| undefined`                                                                                                           | no       |             |
| isRoot            | property | `boolean \| undefined`                                                                                                                                   | no       |             |
| node              | property | `UiNode`                                                                                                                                                 | yes      |             |
| onDiagnostics     | property | `((diagnostics: readonly DataSourceDiagnostic[]) => void) \| undefined`                                                                                  | no       |             |
| operationResults  | property | `Readonly<Record<string, BindingValue \| undefined>> \| undefined`                                                                                       | no       |             |
| registry          | property | `ComponentRegistry \| undefined`                                                                                                                         | no       |             |
| stateAdapter      | property | `StateAdapter \| undefined`                                                                                                                              | no       |             |
| wrapNode          | property | `((args: RuntimeRendererWrapArgs) => React.ReactNode) \| undefined`                                                                                      | no       |             |

## RuntimeRendererWrapArgs

Kind: `type`
Module: `src/RuntimeRendererConfig.tsx`
Source: `src/RuntimeRendererConfig.tsx:21:1`

### Members

| Name     | Kind     | Type              | Required | Description |
| -------- | -------- | ----------------- | -------- | ----------- |
| isRoot   | property | `boolean`         | yes      |             |
| node     | property | `UiNode`          | yes      |             |
| rendered | property | `React.ReactNode` | yes      |             |

## RuntimeResolveNodePropsArgs

Kind: `type`
Module: `src/RuntimeRendererConfig.tsx`
Source: `src/RuntimeRendererConfig.tsx:27:1`

### Members

| Name  | Kind     | Type                      | Required | Description |
| ----- | -------- | ------------------------- | -------- | ----------- |
| node  | property | `UiNode`                  | yes      |             |
| props | property | `Record<string, unknown>` | yes      |             |

## RuntimeScreen

Kind: `function`
Module: `src/RuntimeScreen.tsx`
Source: `src/RuntimeScreen.tsx:24:1`

### Signatures

- `(props: RuntimeScreenProps) => React.JSX.Element`
  - props: `RuntimeScreenProps`
  - returns: `React.JSX.Element`

## RuntimeScreenOperationLoaderExecutionResult

Kind: `type`
Module: `src/runtimeScreenLoaders.ts`
Source: `src/runtimeScreenLoaders.ts:26:1`

### Members

| Name             | Kind     | Type                                                  | Required | Description |
| ---------------- | -------- | ----------------------------------------------------- | -------- | ----------- |
| dependencyKey    | property | `string`                                              | yes      |             |
| diagnostics      | property | `readonly DataSourceDiagnostic[]`                     | yes      |             |
| operationResults | property | `Readonly<Record<string, BindingValue \| undefined>>` | yes      |             |

## RuntimeScreenOperationLoaderState

Kind: `type`
Module: `src/runtimeScreenLoaders.ts`
Source: `src/runtimeScreenLoaders.ts:19:1`

### Members

| Name             | Kind     | Type                                                  | Required | Description |
| ---------------- | -------- | ----------------------------------------------------- | -------- | ----------- |
| dependencyKey    | property | `string`                                              | yes      |             |
| diagnostics      | property | `readonly DataSourceDiagnostic[]`                     | yes      |             |
| operationResults | property | `Readonly<Record<string, BindingValue \| undefined>>` | yes      |             |
| renderVersion    | property | `number`                                              | yes      |             |

## RuntimeScreenProps

Kind: `type`
Module: `src/RuntimeScreen.tsx`
Source: `src/RuntimeScreen.tsx:17:1`

### Members

| Name         | Kind     | Type                             | Required | Description |
| ------------ | -------- | -------------------------------- | -------- | ----------- |
| manifest     | property | `AppManifest`                    | yes      |             |
| registry     | property | `ComponentRegistry \| undefined` | no       |             |
| screen       | property | `ScreenSpec`                     | yes      |             |
| stateAdapter | property | `StateAdapter \| undefined`      | no       |             |

## shouldRenderRuntimeRepeatEmptyState

Kind: `function`
Module: `src/runtimeRepeatEmptyState.ts`
Source: `src/runtimeRepeatEmptyState.ts:3:1`

### Signatures

- `(args: { readonly diagnostics?: readonly DataSourceDiagnostic[]; readonly items?: readonly BindingValue[]; readonly status?: "pending" | "ready"; }) => boolean`
  - args: `{ readonly diagnostics?: readonly DataSourceDiagnostic[]; readonly items?: readonly BindingValue[]; readonly status?: "pending" | "ready"; }`
  - returns: `boolean`

## SURFACE_COMPONENT_REGISTRY

Kind: `value`
Module: `src/registry.tsx`
Source: `src/registry.tsx:51:14`

## useManifest

Kind: `function`
Module: `src/ManifestContext.tsx`
Source: `src/ManifestContext.tsx:22:1`

### Signatures

- `() => AppManifest`
  - returns: `AppManifest`

## useManifestContext

Kind: `function`
Module: `src/ManifestContext.tsx`
Source: `src/ManifestContext.tsx:30:1`

### Signatures

- `() => ManifestContextValue`
  - returns: `ManifestContextValue`

## useOptionalManifestContext

Kind: `function`
Module: `src/ManifestContext.tsx`
Source: `src/ManifestContext.tsx:38:1`

### Signatures

- `() => ManifestContextValue | null`
  - returns: `ManifestContextValue | null`

## useRuntimeApiStateLoaders

Kind: `function`
Module: `src/runtimeApiLoaders.ts`
Source: `src/runtimeApiLoaders.ts:125:1`

### Signatures

- `(args: { readonly data?: AppDataManifest; readonly loaders?: readonly RuntimeApiLoaderDefinition[]; readonly stateAdapter?: StateAdapter; }) => { readonly diagnostics: readonly RuntimeApiLoaderDiagnostic[]; readonly stateAdapter: StateAdapter; readonly stateVersion: number; }`
  - args: `{ readonly data?: AppDataManifest; readonly loaders?: readonly RuntimeApiLoaderDefinition[]; readonly stateAdapter?: StateAdapter; }`
  - returns: `{ readonly diagnostics: readonly RuntimeApiLoaderDiagnostic[]; readonly stateAdapter: StateAdapter; readonly stateVersion: number; }`

## useRuntimeRendererConfig

Kind: `function`
Module: `src/RuntimeRendererConfig.tsx`
Source: `src/RuntimeRendererConfig.tsx:167:1`

### Signatures

- `() => RuntimeRendererConfig`
  - returns: `RuntimeRendererConfig`

## useRuntimeScreenOperationLoaders

Kind: `function`
Module: `src/runtimeScreenLoaders.ts`
Source: `src/runtimeScreenLoaders.ts:284:1`

### Signatures

- `(args: { readonly bindingContext?: Record<string, unknown>; readonly dataSources?: RuntimeBindingResolutionContext["dataSources"]; readonly executeOperation?: RuntimeBindingOperationExecutor; readonly operationResults?: RuntimeBindingOperationResultCache; readonly onDiagnostics?: (diagnostics: readonly DataSourceDiagnostic[]) => void; readonly screen: ScreenSpec; }) => RuntimeScreenOperationLoaderState`
  - args: `{ readonly bindingContext?: Record<string, unknown>; readonly dataSources?: RuntimeBindingResolutionContext["dataSources"]; readonly executeOperation?: RuntimeBindingOperationExecutor; readonly operationResults?: RuntimeBindingOperationResultCache; readonly onDiagnostics?: (diagnostics: readonly DataSourceDiagnostic[]) => void; readonly screen: ScreenSpec; }`
  - returns: `RuntimeScreenOperationLoaderState`

## validateRuntimeBindingOperationRef

Kind: `function`
Module: `src/runtimeBindings.ts`
Source: `src/runtimeBindings.ts:169:1`

### Signatures

- `(operation: BindingOperationRef, dataSources: Readonly<Record<string, DataSourceConfig>> | undefined) => readonly DataSourceDiagnostic[]`
  - dataSources: `Readonly<Record<string, DataSourceConfig>> | undefined`
  - operation: `BindingOperationRef`
  - returns: `readonly DataSourceDiagnostic[]`

## wrapRuntimeEventProps

Kind: `function`
Module: `src/runtimeActionRegistry.ts`
Source: `src/runtimeActionRegistry.ts:180:1`

### Signatures

- `(args: RuntimeEventPropWrapArgs) => Record<string, unknown>`
  - args: `RuntimeEventPropWrapArgs`
  - returns: `Record<string, unknown>`

## ZORA_COMPONENT_REGISTRY

Kind: `value`
Module: `src/registry.tsx`
Source: `src/registry.tsx:95:14`
