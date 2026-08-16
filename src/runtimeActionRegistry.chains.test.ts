import type {
  ApiDefinitionList,
  BindingOperationRef,
  BindingValue,
  ComponentDataBindingRegistry,
} from '@ankhorage/contracts';
import { describe, expect, it } from 'bun:test';

import { dispatchRuntimeComponentEvent } from './runtimeActionRegistry';

const lookupOperation: BindingOperationRef = {
  apiId: 'nutrition',
  endpointId: 'products',
  operationId: 'products.byBarcode',
};

function createApis(): ApiDefinitionList {
  return [
    {
      id: 'nutrition',
      origin: 'external',
      protocol: 'rest',
      baseUrl: 'https://api.ankhorage.com/v1/nutrition',
      endpoints: {
        products: {
          id: 'products',
          kind: 'http',
          operations: {
            'products.byBarcode': {
              id: 'products.byBarcode',
              endpointId: 'products',
              protocol: 'http',
              intent: 'read',
              method: 'GET',
              path: '/products/by-barcode/{barcode}',
            },
          },
        },
      },
    },
  ];
}

function createScannerBindings(): ComponentDataBindingRegistry {
  return {
    scanner: {
      componentId: 'scanner',
      events: {
        barcodeScanned: [
          {
            target: { kind: 'operation', operation: lookupOperation },
            input: {
              barcode: {
                kind: 'source',
                source: { kind: 'event', path: 'payload.value' },
              },
            },
          },
          {
            target: { kind: 'action', type: 'navigate' },
            when: {
              source: { kind: 'operation', operation: lookupOperation, path: 'product.id' },
              operator: 'exists',
            },
            input: {
              route: { kind: 'literal', value: '/products/[id]' },
              params: {
                kind: 'object',
                fields: {
                  id: {
                    kind: 'source',
                    source: {
                      kind: 'operation',
                      operation: lookupOperation,
                      path: 'product.id',
                    },
                  },
                },
              },
            },
          },
          {
            target: { kind: 'action', type: 'navigate' },
            when: {
              source: { kind: 'operation', operation: lookupOperation, path: 'product.id' },
              operator: 'notExists',
            },
            input: {
              route: { kind: 'literal', value: '/products/create' },
              params: {
                kind: 'object',
                fields: {
                  barcode: {
                    kind: 'source',
                    source: { kind: 'event', path: 'payload.value' },
                  },
                },
              },
            },
          },
        ],
      },
    },
  };
}

function scannerEvent() {
  return {
    node: { id: 'scanner', type: 'BarcodeScannerView' },
    eventName: 'barcodeScanned',
    event: {
      type: 'barcodeScanned',
      sourceNodeId: 'scanner',
      payload: { value: '7612345678901', type: 'ean13' },
    },
  } as const;
}

describe('runtime chained API event bindings', () => {
  it('uses the operation result in a subsequent conditional action binding', async () => {
    const actions: { type: string; payload?: object }[] = [];
    const inputs: (BindingValue | undefined)[] = [];
    const diagnostics = await dispatchRuntimeComponentEvent({
      ...scannerEvent(),
      apis: createApis(),
      dataBindings: createScannerBindings(),
      executeAction: ({ action }) => {
        actions.push(action);
      },
      executeOperation: ({ input }) => {
        inputs.push(input);
        return Promise.resolve({ ok: true, data: { product: { id: 'product-1' } } });
      },
    });

    expect(diagnostics).toEqual([]);
    expect(inputs).toEqual([{ barcode: '7612345678901' }]);
    expect(actions).toEqual([
      {
        type: 'navigate',
        payload: { route: '/products/[id]', params: { id: 'product-1' } },
      },
    ]);
  });

  it('takes the create branch when lookup returns no product', async () => {
    const actions: { type: string; payload?: object }[] = [];
    const diagnostics = await dispatchRuntimeComponentEvent({
      ...scannerEvent(),
      apis: createApis(),
      dataBindings: createScannerBindings(),
      executeAction: ({ action }) => {
        actions.push(action);
      },
      executeOperation: () => Promise.resolve({ ok: true, data: {} }),
    });

    expect(diagnostics).toEqual([]);
    expect(actions).toEqual([
      {
        type: 'navigate',
        payload: {
          route: '/products/create',
          params: { barcode: '7612345678901' },
        },
      },
    ]);
  });

  it('stops follow-up bindings when the API operation fails', async () => {
    const actions: { type: string; payload?: object }[] = [];
    const diagnostics = await dispatchRuntimeComponentEvent({
      ...scannerEvent(),
      apis: createApis(),
      dataBindings: createScannerBindings(),
      executeAction: ({ action }) => {
        actions.push(action);
      },
      executeOperation: () =>
        Promise.resolve({
          ok: false,
          diagnostics: [
            {
              apiId: 'nutrition',
              code: 'adapter-error',
              endpointId: 'products',
              message: 'Lookup failed.',
              operationId: 'products.byBarcode',
              severity: 'error',
            },
          ],
        }),
    });

    expect(diagnostics.map((diagnostic) => diagnostic.code)).toEqual(['adapter-error']);
    expect(actions).toEqual([]);
  });
});
