import type { UiNode } from '@ankhorage/contracts';
import { expect, it } from 'bun:test';

import { createComponentEventFromHandlerArgs } from './runtimeActionRegistry';

const node: UiNode = { id: 'sign-in', type: 'SignInForm' };

it('retains the component-supplied canonical emitted capability identity', () => {
  expect(
    createComponentEventFromHandlerArgs({
      capability: 'signInForm.submit',
      eventName: 'submit',
      handlerArgs: [{ email: 'ada@example.com' }],
      node,
    }),
  ).toEqual({
    payload: { values: { email: 'ada@example.com' } },
    sourceNodeId: 'sign-in',
    type: 'signInForm.submit',
  });
});
