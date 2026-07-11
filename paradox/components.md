# Components

## ManifestContext

Source: `src/ManifestContext.tsx:10:14`

Export paths: `src/index.ts`

| Prop     | Type                           | Required | Default | Description |
| -------- | ------------------------------ | -------- | ------- | ----------- |
| children | `ReactNode`                    | no       | —       |             |
| value    | `ManifestContextValue \| null` | yes      | —       |             |

## ManifestProvider

Source: `src/ManifestContext.tsx:12:1`

Export paths: `src/index.ts`

| Prop           | Type                                      | Required | Default | Description |
| -------------- | ----------------------------------------- | -------- | ------- | ----------- |
| activeScreenId | `string \| undefined`                     | no       | —       |             |
| children       | `React.ReactNode \| undefined`            | no       | —       |             |
| manifest       | `AppManifest`                             | yes      | —       |             |
| onScreenChange | `(screenId: string) => void \| undefined` | no       | —       |             |

## RuntimeRenderer

Source: `src/RuntimeRenderer.tsx:68:1`

Export paths: `src/index.ts`

| Prop              | Type                                                                  | Required | Default | Description |
| ----------------- | --------------------------------------------------------------------- | -------- | ------- | ----------- |
| bindingContext    | `Record<string, unknown> \| undefined`                                | no       | —       |             |
| dataBindings      | `ComponentDataBindingRegistry \| undefined`                           | no       | —       |             |
| dataSources       | `DataSourceRegistry \| undefined`                                     | no       | —       |             |
| dbAdapter         | `DbAdapter \| undefined`                                              | no       | —       |             |
| dbRealtimeAdapter | `DbRealtimeAdapter \| undefined`                                      | no       | —       |             |
| disableActions    | `boolean \| undefined`                                                | no       | —       |             |
| executeAction     | `RuntimeActionExecutor \| undefined`                                  | no       | —       |             |
| executeOperation  | `RuntimeBindingOperationExecutor \| undefined`                        | no       | —       |             |
| isRoot            | `boolean \| undefined`                                                | no       | —       |             |
| node              | `UiNode`                                                              | yes      | —       |             |
| onDiagnostics     | `(diagnostics: readonly DataSourceDiagnostic[]) => void \| undefined` | no       | —       |             |
| operationResults  | `RuntimeBindingOperationResultCache \| undefined`                     | no       | —       |             |
| registry          | `ComponentRegistry \| undefined`                                      | no       | —       |             |
| stateAdapter      | `StateAdapter \| undefined`                                           | no       | —       |             |
| wrapNode          | `(args: RuntimeRendererWrapArgs) => React.ReactNode \| undefined`     | no       | —       |             |

## RuntimeRendererConfigProvider

Source: `src/RuntimeRendererConfig.tsx:152:1`

Export paths: `src/index.ts`

| Prop     | Type                           | Required | Default | Description |
| -------- | ------------------------------ | -------- | ------- | ----------- |
| children | `React.ReactNode \| undefined` | no       | —       |             |
| value    | `RuntimeRendererConfig`        | yes      | —       |             |

## RuntimeScreen

Source: `src/RuntimeScreen.tsx:24:1`

Export paths: `src/index.ts`

| Prop         | Type                             | Required | Default | Description |
| ------------ | -------------------------------- | -------- | ------- | ----------- |
| manifest     | `AppManifest`                    | yes      | —       |             |
| registry     | `ComponentRegistry \| undefined` | no       | —       |             |
| screen       | `ScreenSpec`                     | yes      | —       |             |
| stateAdapter | `StateAdapter \| undefined`      | no       | —       |             |
