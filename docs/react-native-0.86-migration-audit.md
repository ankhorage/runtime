# React 19.2 and React Native 0.86 migration audit

This audit covers `@ankhorage/runtime` ownership for roadmap step `[expo 2]`. Runtime remains the platform-neutral renderer, action, event, binding, and state-adapter layer. It does not consume Expo or `@ankhorage/expo-runtime/platform`; application configuration and native-device acceptance remain with later roadmap owners.

## Target baseline

- **CHANGE REQUIRED — consumer and validation baseline.** Exact React and React Native peer/development versions move from React 19.1.0 and RN 0.81.5 to React 19.2.3 and RN 0.86.2. React Native Web is an optional `~0.21.0` peer and a 0.21.2 development dependency. TypeScript validation moves from 5.9 to 6.0.3.
- **CHANGE REQUIRED — tooling baseline.** Devtools moves to 1.6.0, Bun remains on the Devtools-owned 1.3.14 policy, repository Node execution declares 24.x, and Node typings move from 25.x to 24.13.3.
- **VERIFIED: NO CHANGE REQUIRED — internal package releases.** The current published direct Ankhorage releases remain `@ankhorage/contracts` 8.0.0, `@ankhorage/data-sources` 2.0.0, and `@ankhorage/paradox` 0.1.21. No cross-repository compatibility blocker was found.

## Release-by-release review

| Release                                                              | Runtime-relevant upstream surface                                                                                                                           | Outcome                                                                                                                                                                                                              |
| -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [RN 0.82](https://reactnative.dev/blog/2025/10/08/react-native-0.82) | New Architecture only; DOM-like native node refs; React 19.1.1; legacy native architecture begins removal                                                   | **VERIFIED: NO CHANGE REQUIRED.** Runtime has no native module, view manager, architecture switch, measurement call, imperative handle, or exposed native ref.                                                       |
| [RN 0.83](https://reactnative.dev/blog/2025/12/10/react-native-0.83) | React 19.2; no user-facing breaking changes; Android networking/animation deprecations                                                                      | **CHANGE REQUIRED.** Context consumers and providers now exercise React 19 `use()` and context-as-provider behavior, with React 19.2 renderer coverage. The Android-native deprecations are not used.                |
| [RN 0.84](https://reactnative.dev/blog/2026/02/11/react-native-0.84) | Hermes V1 default; further Legacy Architecture removal; React 19.2.3; Node 22 minimum; native API removals                                                  | **CHANGE REQUIRED.** React moves to 19.2.3 and Ankhorage tooling moves to Node 24. **VERIFIED: NO CHANGE REQUIRED** for Hermes and removed native APIs because Runtime owns only JavaScript/TypeScript library code. |
| [RN 0.85](https://reactnative.dev/blog/2026/04/07/react-native-0.85) | Shared Animation Backend; Jest preset extraction; `StyleSheet.absoluteFillObject` removal; TypeScript utility changes; Metro 0.84; event and native cleanup | **VERIFIED: NO CHANGE REQUIRED.** Runtime uses Bun tests, has no animation implementation, does not use the removed style API, and compiles its dynamic renderer/binding contracts with RN 0.86 and TypeScript 6.    |
| [RN 0.86](https://reactnative.dev/blog/2026/06/11/react-native-0.86) | Edge-to-edge measurement fixes; hit-testing/layout fixes; Modal styling; Metro 0.84.2; no user-facing breaking changes                                      | **VERIFIED: NO CHANGE REQUIRED.** Runtime neither measures layout nor owns Modal, transforms, StatusBar, keyboard avoidance, native build configuration, or Metro configuration.                                     |

## Required audit areas

- **VERIFIED: NO CHANGE REQUIRED — removed and deprecated APIs.** Active implementation has no `StyleSheet.absoluteFillObject`, React Native Jest preset, deprecated accessibility focus call, networking interceptor, `ViewUtil`, `AppRegistry` instrumentation hook, legacy bridge API, or removed native/C++ symbol usage. The only React Native imports are `StyleSheet`, `Text`, and `View` for the unknown-component fallback.
- **CHANGE REQUIRED — TypeScript types.** The repository compiles with TypeScript 6.0.3, `@types/react` 19.2.18, RN 0.86.2 declarations, Bun 1.3.14 typings, and Node 24.13.3 typings. Strict settings remain enabled and no suppression or migration compatibility type was added.
- **VERIFIED: NO CHANGE REQUIRED — Fabric and New Architecture behavior.** Components are injected as `React.ElementType`; Runtime has no native component registration, TurboModule, bridge, codegen, architecture flag, or legacy renderer branch.
- **VERIFIED: NO CHANGE REQUIRED — layout and measurement assumptions.** Runtime forwards manifest props/styles and renders an ordinary error fallback. It does not inspect coordinates, call `measure`/`measureInWindow`, manage safe areas, or depend on edge-to-edge viewport dimensions.
- **VERIFIED: NO CHANGE REQUIRED — refs and imperative handles.** Runtime exposes no component ref contract or imperative handle. RN 0.82 DOM-like native refs therefore do not alter the public surface.
- **VERIFIED: NO CHANGE REQUIRED — event semantics.** Runtime treats host event arguments as `unknown`, preserves existing callbacks, derives canonical component events, and dispatches bindings/actions through existing covered contracts. It does not branch on RN private event objects or native emitter APIs.
- **VERIFIED: NO CHANGE REQUIRED — native component rendering contracts.** Registry entries remain host-injected React element types. Runtime does not manufacture native view configs or assume Paper/Fabric host instances.
- **VERIFIED: NO CHANGE REQUIRED — Metro and module resolution.** Package root and `./bindings` exports remain unchanged. Runtime has no Metro configuration, alias, resolver override, Expo Router compatibility dependency, or source deep import.
- **CHANGE REQUIRED — React Native Web interaction.** The package now records the supported 0.21 line as an optional peer and validates against RNW 0.21.2. Runtime continues to import `react-native`, leaving the normal consumer bundler alias in the app owner; it does not import Web-only APIs or introduce a second rendering path. RNW 0.21.2 changes to Modal, Animated props, and accessibility forwarding do not intersect Runtime-owned primitives.
- **VERIFIED: NO CHANGE REQUIRED — native modules, Android, and iOS.** Runtime owns no native project, module interface, platform version, permission integration, or native build setting.
- **VERIFIED: NO CHANGE REQUIRED — animation and gesture semantics.** Runtime owns no Animated, Reanimated, Worklets, or Gesture Handler implementation. Those remain later owner roadmap steps.

## React 19.2 and React Compiler compatibility

- **CHANGE REQUIRED — React 19 context behavior.** Context reads use React 19 `use()` and providers use the context object directly. Server-rendered tests cover required, optional, and nested provider behavior under React 19.2.3.
- **CHANGE REQUIRED — compiler-safe render and effect patterns.** Render-time ref reads used for event-handler caches were replaced with dependency-aware values. Async repeat/media and screen-loader state now uses request identity and derived pending state instead of synchronous effect resets or render-time ref mutation.
- **VERIFIED: NO CHANGE REQUIRED — manual memoization semantics.** Remaining memoization preserves stable state adapters, registries, request plans, and handler caches. It is semantic identity management rather than a blanket compiler substitute.
- **VERIFIED: NO CHANGE REQUIRED — compiler opt-outs.** `bunx react-compiler-healthcheck@latest` compiled 11 of 11 components and found no incompatible libraries. No `"use no memo"` directive, compiler suppression, Babel plugin, or Expo application experiment was added. Runtime ships ordinary source/build output for compiler-enabled consumers and leaves app-level enablement to Studio.

React's [library compiler guidance](https://react.dev/reference/react-compiler/compiling-libraries) distinguishes a library's compatibility from an application's compiler setup. This step validates compatibility only and intentionally does not add app-level Expo Compiler configuration.

## Validation evidence

The migration is covered by the repository test suite, explicit React 19.2 context tests, package-isolation/baseline assertions, TypeScript 6 compilation, the React Compiler health check, and the issue-required repository/release gates. The Web compatibility test bundles the real Runtime renderer with `react-native` resolved to RNW 0.21.2 and server-renders injected `View`/`Text` registry entries. The package-isolation test rejects Expo, Expo modules, and `@ankhorage/expo-runtime` in implementation source and all dependency sections.

No owner-first follow-up or external release blocker was discovered in this step.
