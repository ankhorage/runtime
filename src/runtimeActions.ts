import type { Action } from '@ankhorage/contracts';

import type { RuntimeActionHandlers } from './RuntimeRendererConfig';

function resolvePath(pathname: string, params?: Record<string, string | number>) {
  if (!params) {
    const unusedParams: Record<string, string | number> = {};
    return { resolvedPath: pathname, unusedParams };
  }

  let resolvedPath = pathname;
  const unusedParams: Record<string, string | number> = { ...params };

  Object.keys(params).forEach((key) => {
    const placeholder = `[${key}]`;
    if (!resolvedPath.includes(placeholder)) {
      return;
    }

    resolvedPath = resolvedPath.replace(placeholder, String(params[key]));
    delete unusedParams[key];
  });

  return { resolvedPath, unusedParams };
}

function isAction(value: unknown): value is Action {
  return typeof value === 'object' && value !== null && 'type' in value;
}

function isActionCallback(value: unknown): value is () => void {
  return typeof value === 'function';
}

interface RouterLike {
  push: (args: { pathname: string; params: Record<string, string | number> }) => void;
}

export async function executeRuntimeAction(args: {
  action: unknown;
  router: RouterLike;
  mode: 'light' | 'dark';
  setMode: (mode: 'light' | 'dark') => void;
  actionHandlers?: RuntimeActionHandlers;
  requestAnimationFrameImpl?: typeof requestAnimationFrame;
  alertImpl?: typeof alert;
  consoleImpl?: Pick<typeof console, 'log'>;
}): Promise<void> {
  const {
    action,
    router,
    mode,
    setMode,
    actionHandlers,
    requestAnimationFrameImpl = requestAnimationFrame,
    alertImpl = alert,
    consoleImpl = console,
  } = args;

  if (!action) {
    return;
  }

  if (isActionCallback(action)) {
    action();
    return;
  }

  if (!isAction(action)) {
    return;
  }

  if (action.type === 'navigate' && action.payload.route) {
    const { route, params } = action.payload;
    requestAnimationFrameImpl(() => {
      // Navigation bindings target the manifest route path directly; resolve dynamic
      // `[param]` placeholders here instead of introducing a second target abstraction.
      let pathname = route;
      if (!pathname.startsWith('/') && !pathname.startsWith('(')) {
        pathname = `/${pathname}`;
      }

      const { resolvedPath, unusedParams } = resolvePath(pathname, params);
      router.push({
        pathname: resolvedPath,
        params: unusedParams,
      });
    });
    return;
  }

  if (action.type === 'toggleDarkMode') {
    setMode(mode === 'dark' ? 'light' : 'dark');
    return;
  }

  if (action.type === 'search') {
    consoleImpl.log('[Ankh Action] Search:', action.payload);
    return;
  }

  if (action.type === 'filter') {
    consoleImpl.log('[Ankh Action] Filter:', action.payload);
    return;
  }

  if (action.type === 'alert') {
    const message = action.payload?.message ?? JSON.stringify(action.payload);
    alertImpl(message);
    return;
  }

  if (action.type === 'console') {
    consoleImpl.log('[Ankh Action]', action.payload);
    return;
  }

  const configuredHandler = actionHandlers?.[action.type];
  if (configuredHandler) {
    await configuredHandler({ action });
  }
}
