# Public API

## ComponentRegistry

Kind: `unknown`
Module: `src/componentRegistry.ts`
Source: `src/componentRegistry.ts:3:1`

## composeRuntimeNodePropsResolver

Kind: `function`
Module: `src/RuntimeRendererConfig.tsx`
Source: `src/RuntimeRendererConfig.tsx:92:1`

### Signatures

- `(localResolver?: RuntimeNodePropsResolver | undefined, inheritedResolver?: RuntimeNodePropsResolver | undefined) => RuntimeNodePropsResolver | undefined`
  - inheritedResolver: `RuntimeNodePropsResolver | undefined` (optional)
  - localResolver: `RuntimeNodePropsResolver | undefined` (optional)
  - returns: `RuntimeNodePropsResolver | undefined`

## composeRuntimeRendererWrapNode

Kind: `function`
Module: `src/RuntimeRendererConfig.tsx`
Source: `src/RuntimeRendererConfig.tsx:77:1`

### Signatures

- `(innerWrapNode?: ((args: RuntimeRendererWrapArgs) => React.ReactNode) | undefined, outerWrapNode?: ((args: RuntimeRendererWrapArgs) => React.ReactNode) | undefined) => ((args: RuntimeRendererWrapArgs) => React.ReactNode) | undefined`
  - innerWrapNode: `((args: RuntimeRendererWrapArgs) => React.ReactNode) | undefined` (optional)
  - outerWrapNode: `((args: RuntimeRendererWrapArgs) => React.ReactNode) | undefined` (optional)
  - returns: `((args: RuntimeRendererWrapArgs) => React.ReactNode) | undefined`

## createComponentEventFromHandlerArgs

Kind: `function`
Module: `src/runtimeActionRegistry.ts`
Source: `src/runtimeActionRegistry.ts:216:1`

### Signatures

- `(args: { readonly node: UiNode; readonly eventName: string; readonly handlerArgs: readonly unknown[]; }) => ComponentEventDto<string, RuntimeEventPayload>`
  - args: `{ readonly node: UiNode; readonly eventName: string; readonly handlerArgs: readonly unknown[]; }`
  - returns: `ComponentEventDto<string, RuntimeEventPayload>`

## createComponentRegistry

Kind: `function`
Module: `src/componentRegistry.ts`
Source: `src/componentRegistry.ts:5:1`

### Signatures

- `(registries?: readonly Readonly<Record<string, React.ElementType<any, keyof React.JSX.IntrinsicElements>>>[]) => Readonly<Record<string, React.ElementType<any, keyof React.JSX.IntrinsicElements>>>`
  - registries: `readonly Readonly<Record<string, React.ElementType<any, keyof React.JSX.IntrinsicElements>>>[]` (optional)
  - returns: `Readonly<Record<string, React.ElementType<any, keyof React.JSX.IntrinsicElements>>>`

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
Source: `src/runtimeScreenLoaders.ts:82:1`

### Signatures

- `(args: { readonly dependencyKey: string; readonly previousState?: RuntimeScreenOperationLoaderState; }) => RuntimeScreenOperationLoaderState`
  - args: `{ readonly dependencyKey: string; readonly previousState?: RuntimeScreenOperationLoaderState; }`
  - returns: `RuntimeScreenOperationLoaderState`

## createRuntimeActionRegistry

Kind: `function`
Module: `src/runtimeActionRegistry.ts`
Source: `src/runtimeActionRegistry.ts:66:1`

### Signatures

- `(options?: { actionHandlers?: RuntimeActionHandlers; apis?: ApiDefinitionList; dataBindings?: ComponentDataBindingRegistry; executeAction?: RuntimeActionHandler; executeOperation?: RuntimeBindingOperationExecutor; operationResults?: RuntimeBindingOperationResultCache; writeOperationResult?: RuntimeBindingOperationResultWriter; }) => RuntimeActionRegistry`
  - options: `{ actionHandlers?: RuntimeActionHandlers; apis?: ApiDefinitionList; dataBindings?: ComponentDataBindingRegistry; executeAction?: RuntimeActionHandler; executeOperation?: RuntimeBindingOperationExecutor; operationResults?: RuntimeBindingOperationResultCache; writeOperationResult?: RuntimeBindingOperationResultWriter; }` (optional)
  - returns: `RuntimeActionRegistry`

## createRuntimeApiOperationExecutor

Kind: `function`
Module: `src/runtimeApiOperations.ts`
Source: `src/runtimeApiOperations.ts:12:1`

### Signatures

- `(options: RuntimeApiOperationExecutorOptions) => RuntimeBindingOperationExecutor`
  - options: `RuntimeApiOperationExecutorOptions`
  - returns: `RuntimeBindingOperationExecutor`

## createRuntimeBindingOperationKey

Kind: `function`
Module: `src/runtimeBindings.ts`
Source: `src/runtimeBindings.ts:165:1`

### Signatures

- `(operation: BindingOperationRef) => string`
  - operation: `BindingOperationRef`
  - returns: `string`

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
Source: `src/runtimeScreenLoaders.ts:49:1`

### Signatures

- `(args: { readonly screenId: string; readonly loaders: readonly OperationScreenDataLoaderDefinition[]; readonly bindingContext?: Record<string, unknown>; readonly operationResults?: RuntimeBindingOperationResultCache; }) => string`
  - args: `{ readonly screenId: string; readonly loaders: readonly OperationScreenDataLoaderDefinition[]; readonly bindingContext?: Record<string, unknown>; readonly operationResults?: RuntimeBindingOperationResultCache; }`
  - returns: `string`

## dispatchRuntimeComponentEvent

Kind: `function`
Module: `src/runtimeActionRegistry.ts`
Source: `src/runtimeActionRegistry.ts:102:1`

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

## executeRuntimeScreenOperationLoaders

Kind: `function`
Module: `src/runtimeScreenLoaders.ts`
Source: `src/runtimeScreenLoaders.ts:178:1`

### Signatures

- `(args: { readonly bindingContext?: Record<string, unknown>; readonly apis?: RuntimeBindingResolutionContext["apis"]; readonly executeOperation?: RuntimeBindingOperationExecutor; readonly operationResults?: RuntimeBindingOperationResultCache; readonly screen: ScreenSpec; readonly loaders: readonly OperationScreenDataLoaderDefinition[]; }) => Promise<RuntimeScreenOperationLoaderExecutionResult>`
  - args: `{ readonly bindingContext?: Record<string, unknown>; readonly apis?: RuntimeBindingResolutionContext["apis"]; readonly executeOperation?: RuntimeBindingOperationExecutor; readonly operationResults?: RuntimeBindingOperationResultCache; readonly screen: ScreenSpec; readonly loaders: readonly OperationScreenDataLoaderDefinition[]; }`
  - returns: `Promise<RuntimeScreenOperationLoaderExecutionResult>`

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

## mergeRuntimeRendererConfig

Kind: `function`
Module: `src/RuntimeRendererConfig.tsx`
Source: `src/RuntimeRendererConfig.tsx:110:1`

### Signatures

- `(localConfig: RuntimeRendererConfig | undefined, inheritedConfig: RuntimeRendererConfig | undefined) => RuntimeRendererConfig`
  - inheritedConfig: `RuntimeRendererConfig | undefined`
  - localConfig: `RuntimeRendererConfig | undefined`
  - returns: `RuntimeRendererConfig`

## resolveBindingInputMap

Kind: `function`
Module: `src/runtimeBindings.ts`
Source: `src/runtimeBindings.ts:131:1`

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
Source: `src/runtimeActionRegistry.ts:230:1`

### Signatures

- `(payload: object | undefined, args: RuntimeActionResolutionArgs) => object | undefined`
  - args: `RuntimeActionResolutionArgs`
  - payload: `object | undefined`
  - returns: `object | undefined`

## resolveRuntimeActionValue

Kind: `function`
Module: `src/runtimeActionRegistry.ts`
Source: `src/runtimeActionRegistry.ts:241:1`

### Signatures

- `(value: unknown, args: RuntimeActionResolutionArgs) => object | undefined`
  - args: `RuntimeActionResolutionArgs`
  - value: `unknown`
  - returns: `object | undefined`

## resolveRuntimeBindings

Kind: `function`
Module: `src/runtimeBindings.ts`
Source: `src/runtimeBindings.ts:91:1`

### Signatures

- `(args: RuntimeBindingResolutionArgs) => RuntimeBindingResolutionResult`
  - args: `RuntimeBindingResolutionArgs`
  - returns: `RuntimeBindingResolutionResult`

## resolveRuntimeBindingsAsync

Kind: `function`
Module: `src/runtimeBindings.ts`
Source: `src/runtimeBindings.ts:76:1`

### Signatures

- `(args: RuntimeBindingResolutionArgs) => Promise<RuntimeBindingResolutionResult>`
  - args: `RuntimeBindingResolutionArgs`
  - returns: `Promise<RuntimeBindingResolutionResult>`

## resolveRuntimeBindingValue

Kind: `function`
Module: `src/runtimeBindings.ts`
Source: `src/runtimeBindings.ts:105:1`

### Signatures

- `(binding: PropBinding, context: RuntimeBindingResolutionContext, diagnostics?: DataSourceDiagnostic[]) => Promise<unknown>`
  - binding: `PropBinding`
  - context: `RuntimeBindingResolutionContext`
  - diagnostics: `DataSourceDiagnostic[]` (optional)
  - returns: `Promise<unknown>`

## resolveRuntimeBindingValueSync

Kind: `function`
Module: `src/runtimeBindings.ts`
Source: `src/runtimeBindings.ts:118:1`

### Signatures

- `(binding: PropBinding, context: RuntimeBindingResolutionContext, diagnostics?: DataSourceDiagnostic[]) => unknown`
  - binding: `PropBinding`
  - context: `RuntimeBindingResolutionContext`
  - diagnostics: `DataSourceDiagnostic[]` (optional)
  - returns: `unknown`

## resolveScreenOperationLoaders

Kind: `function`
Module: `src/runtimeScreenLoaders.ts`
Source: `src/runtimeScreenLoaders.ts:43:1`

### Signatures

- `(screen: ScreenSpec) => readonly OperationScreenDataLoaderDefinition[]`
  - screen: `ScreenSpec`
  - returns: `readonly OperationScreenDataLoaderDefinition[]`

## RuntimeAction

Kind: `unknown`
Module: `src/RuntimeRendererConfig.tsx`
Source: `src/RuntimeRendererConfig.tsx:45:1`

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
Source: `src/RuntimeRendererConfig.tsx:48:1`

## RuntimeActionHandler

Kind: `unknown`
Module: `src/RuntimeRendererConfig.tsx`
Source: `src/RuntimeRendererConfig.tsx:46:1`

## RuntimeActionHandlerArgs

Kind: `type`
Module: `src/RuntimeRendererConfig.tsx`
Source: `src/RuntimeRendererConfig.tsx:38:1`

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
Source: `src/RuntimeRendererConfig.tsx:47:1`

## RuntimeActionRegistry

Kind: `type`
Module: `src/runtimeActionRegistry.ts`
Source: `src/runtimeActionRegistry.ts:30:1`

### Members

| Name                   | Kind   | Type                                                          | Required | Description |
| ---------------------- | ------ | ------------------------------------------------------------- | -------- | ----------- |
| dispatchComponentEvent | method | `(args: RuntimeComponentEventDispatchArgs) => Promise<void>`  | yes      |             |
| registerActionHandler  | method | `(type: string, handler: RuntimeActionHandler) => () => void` | yes      |             |

## RuntimeActionResolutionArgs

Kind: `type`
Module: `src/runtimeActionRegistry.ts`
Source: `src/runtimeActionRegistry.ts:41:1`

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
Source: `src/runtimeActionRegistry.ts:35:1`

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

## RuntimeApiOperationExecutorOptions

Kind: `type`
Module: `src/runtimeApiOperations.ts`
Source: `src/runtimeApiOperations.ts:7:1`

### Members

| Name               | Kind     | Type                                          | Required | Description |
| ------------------ | -------- | --------------------------------------------- | -------- | ----------- |
| credentialResolver | property | `EndpointTestCredentialResolver \| undefined` | no       |             |
| fetch              | property | `EndpointTestFetch \| undefined`              | no       |             |

## RuntimeApiOperationSelection

Kind: `type`
Module: `src/runtimeApiSelection.ts`
Source: `src/runtimeApiSelection.ts:9:1`

### Members

| Name     | Kind     | Type                 | Required | Description |
| -------- | -------- | -------------------- | -------- | ----------- |
| api      | property | `ApiDefinition`      | yes      |             |
| endpoint | property | `DataEndpointConfig` | yes      |             |

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
Source: `src/runtimeBindings.ts:24:1`

### Members

| Name      | Kind     | Type                        | Required | Description |
| --------- | -------- | --------------------------- | -------- | ----------- |
| api       | property | `ApiDefinition`             | yes      |             |
| endpoint  | property | `DataEndpointConfig`        | yes      |             |
| input     | property | `BindingValue \| undefined` | no       |             |
| node      | property | `UiNode \| undefined`       | no       |             |
| operation | property | `BindingOperationRef`       | yes      |             |

## RuntimeBindingOperationExecutionResult

Kind: `unknown`
Module: `src/runtimeBindings.ts`
Source: `src/runtimeBindings.ts:32:1`

## RuntimeBindingOperationExecutor

Kind: `unknown`
Module: `src/runtimeBindings.ts`
Source: `src/runtimeBindings.ts:43:1`

## RuntimeBindingOperationKey

Kind: `unknown`
Module: `src/runtimeBindings.ts`
Source: `src/runtimeBindings.ts:22:1`

## RuntimeBindingOperationResultCache

Kind: `unknown`
Module: `src/runtimeBindings.ts`
Source: `src/runtimeBindings.ts:47:1`

## RuntimeBindingOperationResultWriter

Kind: `unknown`
Module: `src/runtimeBindings.ts`
Source: `src/runtimeBindings.ts:51:1`

## RuntimeBindingResolutionArgs

Kind: `type`
Module: `src/runtimeBindings.ts`
Source: `src/runtimeBindings.ts:66:1`

### Members

| Name             | Kind     | Type                                                                                                       | Required | Description |
| ---------------- | -------- | ---------------------------------------------------------------------------------------------------------- | -------- | ----------- |
| apis             | property | `ApiDefinitionList \| undefined`                                                                           | no       |             |
| context          | property | `Record<string, unknown> \| undefined`                                                                     | no       |             |
| dataBindings     | property | `Readonly<Record<string, import("@ankhorage/contracts/dist/bindings").ComponentDataBinding>> \| undefined` | no       |             |
| event            | property | `ComponentEventDto<string, object> \| undefined`                                                           | no       |             |
| executeOperation | property | `RuntimeBindingOperationExecutor \| undefined`                                                             | no       |             |
| node             | property | `UiNode`                                                                                                   | yes      |             |
| operationResults | property | `Readonly<Record<string, BindingValue \| undefined>> \| undefined`                                         | no       |             |
| props            | property | `Record<string, unknown>`                                                                                  | yes      |             |
| stateAdapter     | property | `StateAdapter \| undefined`                                                                                | no       |             |

## RuntimeBindingResolutionContext

Kind: `type`
Module: `src/runtimeBindings.ts`
Source: `src/runtimeBindings.ts:56:1`

### Members

| Name             | Kind     | Type                                                                                                       | Required | Description |
| ---------------- | -------- | ---------------------------------------------------------------------------------------------------------- | -------- | ----------- |
| apis             | property | `ApiDefinitionList \| undefined`                                                                           | no       |             |
| context          | property | `Record<string, unknown> \| undefined`                                                                     | no       |             |
| dataBindings     | property | `Readonly<Record<string, import("@ankhorage/contracts/dist/bindings").ComponentDataBinding>> \| undefined` | no       |             |
| event            | property | `ComponentEventDto<string, object> \| undefined`                                                           | no       |             |
| executeOperation | property | `RuntimeBindingOperationExecutor \| undefined`                                                             | no       |             |
| operationResults | property | `Readonly<Record<string, BindingValue \| undefined>> \| undefined`                                         | no       |             |
| stateAdapter     | property | `StateAdapter \| undefined`                                                                                | no       |             |

## RuntimeBindingResolutionResult

Kind: `type`
Module: `src/runtimeBindings.ts`
Source: `src/runtimeBindings.ts:71:1`

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
Source: `src/runtimeActionRegistry.ts:45:1`

### Members

| Name                 | Kind     | Type                                                                                                       | Required | Description |
| -------------------- | -------- | ---------------------------------------------------------------------------------------------------------- | -------- | ----------- |
| apis                 | property | `ApiDefinitionList \| undefined`                                                                           | no       |             |
| context              | property | `Record<string, unknown> \| undefined`                                                                     | no       |             |
| dataBindings         | property | `Readonly<Record<string, import("@ankhorage/contracts/dist/bindings").ComponentDataBinding>> \| undefined` | no       |             |
| event                | property | `ComponentEventDto<string, object>`                                                                        | yes      |             |
| eventName            | property | `string \| undefined`                                                                                      | no       |             |
| executeAction        | property | `RuntimeActionHandler \| undefined`                                                                        | no       |             |
| executeOperation     | property | `RuntimeBindingOperationExecutor \| undefined`                                                             | no       |             |
| node                 | property | `UiNode`                                                                                                   | yes      |             |
| operationResults     | property | `Readonly<Record<string, BindingValue \| undefined>> \| undefined`                                         | no       |             |
| state                | property | `Record<string, unknown> \| undefined`                                                                     | no       |             |
| writeOperationResult | property | `RuntimeBindingOperationResultWriter \| undefined`                                                         | no       |             |

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
Source: `src/runtimeActionRegistry.ts:56:1`

### Members

| Name                   | Kind     | Type                                                                                                       | Required | Description |
| ---------------------- | -------- | ---------------------------------------------------------------------------------------------------------- | -------- | ----------- |
| context                | property | `Record<string, unknown> \| undefined`                                                                     | no       |             |
| dataBindings           | property | `Readonly<Record<string, import("@ankhorage/contracts/dist/bindings").ComponentDataBinding>> \| undefined` | no       |             |
| disableActions         | property | `boolean`                                                                                                  | yes      |             |
| dispatchComponentEvent | property | `(args: RuntimeComponentEventDispatchArgs) => Promise<void> \| void`                                       | yes      |             |
| node                   | property | `UiNode`                                                                                                   | yes      |             |
| operationResults       | property | `Readonly<Record<string, BindingValue \| undefined>> \| undefined`                                         | no       |             |
| props                  | property | `Record<string, unknown>`                                                                                  | yes      |             |
| state                  | property | `Record<string, unknown> \| undefined`                                                                     | no       |             |

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

## RuntimeMediaAssetResolver

Kind: `unknown`
Module: `src/runtimeMedia.ts`
Source: `src/runtimeMedia.ts:13:1`

## RuntimeMediaAssetResolverArgs

Kind: `type`
Module: `src/runtimeMedia.ts`
Source: `src/runtimeMedia.ts:9:1`

### Members

| Name  | Kind     | Type         | Required | Description |
| ----- | -------- | ------------ | -------- | ----------- |
| asset | property | `MediaAsset` | yes      |             |

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
Module: `node_modules/@ankhorage/contracts/dist/runtimeCallbacks.d.ts`
Source: `node_modules/@ankhorage/contracts/dist/runtimeCallbacks.d.ts:6:1`

## RuntimeRenderer

Kind: `function`
Module: `src/RuntimeRenderer.tsx`
Source: `src/RuntimeRenderer.tsx:76:1`

### Signatures

- `(props: RuntimeRendererProps) => React.JSX.Element`
  - props: `RuntimeRendererProps`
  - returns: `React.JSX.Element`

## RuntimeRendererConfig

Kind: `type`
Module: `src/RuntimeRendererConfig.tsx`
Source: `src/RuntimeRendererConfig.tsx:50:1`

### Members

| Name                 | Kind     | Type                                                                                                            | Required | Description |
| -------------------- | -------- | --------------------------------------------------------------------------------------------------------------- | -------- | ----------- |
| actionHandlers       | property | `RuntimeActionHandlers \| undefined`                                                                            | no       |             |
| apis                 | property | `ApiDefinitionList \| undefined`                                                                                | no       |             |
| bindingContext       | property | `Record<string, unknown> \| undefined`                                                                          | no       |             |
| dataBindings         | property | `Readonly<Record<string, import("@ankhorage/contracts/dist/bindings").ComponentDataBinding>> \| undefined`      | no       |             |
| dbAdapter            | property | `DbAdapter \| undefined`                                                                                        | no       |             |
| dbRealtimeAdapter    | property | `DbRealtimeAdapter \| undefined`                                                                                | no       |             |
| disableActions       | property | `boolean \| undefined`                                                                                          | no       |             |
| executeAction        | property | `RuntimeActionHandler \| undefined`                                                                             | no       |             |
| executeOperation     | property | `RuntimeBindingOperationExecutor \| undefined`                                                                  | no       |             |
| mediaAssets          | property | `Readonly<Record<string, import("@ankhorage/contracts/dist/media").MediaAsset>> \| undefined`                   | no       |             |
| onDiagnostics        | property | `((diagnostics: readonly DataSourceDiagnostic[]) => void) \| undefined`                                         | no       |             |
| operationResults     | property | `Readonly<Record<string, import("@ankhorage/contracts/dist/bindings").BindingValue \| undefined>> \| undefined` | no       |             |
| registry             | property | `Readonly<Record<string, React.ElementType<any, keyof React.JSX.IntrinsicElements>>> \| undefined`              | no       |             |
| resolveMediaAsset    | property | `RuntimeMediaAssetResolver \| undefined`                                                                        | no       |             |
| resolveNodeProps     | property | `RuntimeNodePropsResolver \| undefined`                                                                         | no       |             |
| stateAdapter         | property | `StateAdapter \| undefined`                                                                                     | no       |             |
| wrapNode             | property | `((args: RuntimeRendererWrapArgs) => React.ReactNode) \| undefined`                                             | no       |             |
| writeOperationResult | property | `RuntimeBindingOperationResultWriter \| undefined`                                                              | no       |             |

## RuntimeRendererConfigProvider

Kind: `function`
Module: `src/RuntimeRendererConfig.tsx`
Source: `src/RuntimeRendererConfig.tsx:158:1`

### Signatures

- `(props: { value: RuntimeRendererConfig; children: React.ReactNode; }) => React.JSX.Element`
  - props: `{ value: RuntimeRendererConfig; children: React.ReactNode; }`
  - returns: `React.JSX.Element`

## RuntimeRendererProps

Kind: `type`
Module: `src/RuntimeRenderer.tsx`
Source: `src/RuntimeRenderer.tsx:56:1`

### Members

| Name              | Kind     | Type                                                                                                       | Required | Description |
| ----------------- | -------- | ---------------------------------------------------------------------------------------------------------- | -------- | ----------- |
| apis              | property | `ApiDefinitionList \| undefined`                                                                           | no       |             |
| bindingContext    | property | `Record<string, unknown> \| undefined`                                                                     | no       |             |
| dataBindings      | property | `Readonly<Record<string, import("@ankhorage/contracts/dist/bindings").ComponentDataBinding>> \| undefined` | no       |             |
| dbAdapter         | property | `DbAdapter \| undefined`                                                                                   | no       |             |
| dbRealtimeAdapter | property | `DbRealtimeAdapter \| undefined`                                                                           | no       |             |
| disableActions    | property | `boolean \| undefined`                                                                                     | no       |             |
| executeAction     | property | `import("./src/RuntimeRendererConfig").RuntimeActionHandler \| undefined`                                  | no       |             |
| executeOperation  | property | `RuntimeBindingOperationExecutor \| undefined`                                                             | no       |             |
| isRoot            | property | `boolean \| undefined`                                                                                     | no       |             |
| mediaAssets       | property | `Readonly<Record<string, import("@ankhorage/contracts/dist/media").MediaAsset>> \| undefined`              | no       |             |
| node              | property | `UiNode`                                                                                                   | yes      |             |
| onDiagnostics     | property | `((diagnostics: readonly DataSourceDiagnostic[]) => void) \| undefined`                                    | no       |             |
| operationResults  | property | `Readonly<Record<string, BindingValue \| undefined>> \| undefined`                                         | no       |             |
| registry          | property | `Readonly<Record<string, React.ElementType<any, keyof React.JSX.IntrinsicElements>>> \| undefined`         | no       |             |
| resolveMediaAsset | property | `RuntimeMediaAssetResolver \| undefined`                                                                   | no       |             |
| stateAdapter      | property | `StateAdapter \| undefined`                                                                                | no       |             |
| wrapNode          | property | `((args: RuntimeRendererWrapArgs) => React.ReactNode) \| undefined`                                        | no       |             |

## RuntimeRendererWrapArgs

Kind: `type`
Module: `src/RuntimeRendererConfig.tsx`
Source: `src/RuntimeRendererConfig.tsx:32:1`

### Members

| Name     | Kind     | Type              | Required | Description |
| -------- | -------- | ----------------- | -------- | ----------- |
| isRoot   | property | `boolean`         | yes      |             |
| node     | property | `UiNode`          | yes      |             |
| rendered | property | `React.ReactNode` | yes      |             |

## RuntimeResolvedMediaValue

Kind: `unknown`
Module: `src/runtimeMedia.ts`
Source: `src/runtimeMedia.ts:7:1`

## RuntimeResolveNodePropsArgs

Kind: `type`
Module: `node_modules/@ankhorage/contracts/dist/runtimeCallbacks.d.ts`
Source: `node_modules/@ankhorage/contracts/dist/runtimeCallbacks.d.ts:2:1`

### Members

| Name  | Kind     | Type                      | Required | Description |
| ----- | -------- | ------------------------- | -------- | ----------- |
| node  | property | `UiNode`                  | yes      |             |
| props | property | `Record<string, unknown>` | yes      |             |

## RuntimeScreen

Kind: `function`
Module: `src/RuntimeScreen.tsx`
Source: `src/RuntimeScreen.tsx:17:1`

### Signatures

- `(props: RuntimeScreenProps) => React.JSX.Element`
  - props: `RuntimeScreenProps`
  - returns: `React.JSX.Element`

## RuntimeScreenOperationLoaderExecutionResult

Kind: `type`
Module: `src/runtimeScreenLoaders.ts`
Source: `src/runtimeScreenLoaders.ts:25:1`

### Members

| Name             | Kind     | Type                                                  | Required | Description |
| ---------------- | -------- | ----------------------------------------------------- | -------- | ----------- |
| dependencyKey    | property | `string`                                              | yes      |             |
| diagnostics      | property | `readonly DataSourceDiagnostic[]`                     | yes      |             |
| operationResults | property | `Readonly<Record<string, BindingValue \| undefined>>` | yes      |             |

## RuntimeScreenOperationLoaderState

Kind: `type`
Module: `src/runtimeScreenLoaders.ts`
Source: `src/runtimeScreenLoaders.ts:18:1`

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
Source: `src/RuntimeScreen.tsx:10:1`

### Members

| Name         | Kind     | Type                                                                                               | Required | Description |
| ------------ | -------- | -------------------------------------------------------------------------------------------------- | -------- | ----------- |
| manifest     | property | `AppManifest`                                                                                      | yes      |             |
| registry     | property | `Readonly<Record<string, React.ElementType<any, keyof React.JSX.IntrinsicElements>>> \| undefined` | no       |             |
| screen       | property | `ScreenSpec`                                                                                       | yes      |             |
| stateAdapter | property | `StateAdapter \| undefined`                                                                        | no       |             |

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

## useRuntimeRendererConfig

Kind: `function`
Module: `src/RuntimeRendererConfig.tsx`
Source: `src/RuntimeRendererConfig.tsx:173:1`

### Signatures

- `() => RuntimeRendererConfig`
  - returns: `RuntimeRendererConfig`

## useRuntimeScreenOperationLoaders

Kind: `function`
Module: `src/runtimeScreenLoaders.ts`
Source: `src/runtimeScreenLoaders.ts:273:1`

### Signatures

- `(args: { readonly bindingContext?: Record<string, unknown>; readonly apis?: RuntimeBindingResolutionContext["apis"]; readonly executeOperation?: RuntimeBindingOperationExecutor; readonly operationResults?: RuntimeBindingOperationResultCache; readonly onDiagnostics?: (diagnostics: readonly DataSourceDiagnostic[]) => void; readonly screen: ScreenSpec; }) => RuntimeScreenOperationLoaderState`
  - args: `{ readonly bindingContext?: Record<string, unknown>; readonly apis?: RuntimeBindingResolutionContext["apis"]; readonly executeOperation?: RuntimeBindingOperationExecutor; readonly operationResults?: RuntimeBindingOperationResultCache; readonly onDiagnostics?: (diagnostics: readonly DataSourceDiagnostic[]) => void; readonly screen: ScreenSpec; }`
  - returns: `RuntimeScreenOperationLoaderState`

## validateRuntimeBindingOperationRef

Kind: `function`
Module: `src/runtimeApiSelection.ts`
Source: `src/runtimeApiSelection.ts:14:1`

### Signatures

- `(operation: BindingOperationRef, apis: ApiDefinitionList | undefined) => readonly DataSourceDiagnostic[]`
  - apis: `ApiDefinitionList | undefined`
  - operation: `BindingOperationRef`
  - returns: `readonly DataSourceDiagnostic[]`

## wrapRuntimeEventProps

Kind: `function`
Module: `src/runtimeActionRegistry.ts`
Source: `src/runtimeActionRegistry.ts:179:1`

### Signatures

- `(args: RuntimeEventPropWrapArgs) => Record<string, unknown>`
  - args: `RuntimeEventPropWrapArgs`
  - returns: `Record<string, unknown>`
