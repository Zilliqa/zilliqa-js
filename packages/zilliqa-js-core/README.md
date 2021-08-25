# @zilliqa-js/core

> Core abstractions required for interacting with the blockchain.

# Classes

## `BaseProvider`

Base class for concrete `Providers`.

### `BaseProvider`

**Parameters**

- `nodeURL`: `string` - the URL of the lookup node to send requests to.
- `reqMiddleware`: `Map<Matcher, ReqMiddlewareFn[]>` - an ES6 `Map` of
  `Matcher`, `ReqMiddlewareFn[]` pairs.
- `reqMiddleware`: `Map<Matcher, ResMiddlewareFn[]>` - an ES6 `Map` of
  `Matcher`, `ResMiddlewareFn[]` pairs.

**Returns**

- `BaseProvider`

## Members

### `middleware: { request: { use(fn: ReqMiddlewareFn, match: Matcher = '*') }, response: use(fn: ResMiddlewareFn, match: Matcher = '*') }`

An object that allows setting middleware on requests and responses. Middleware
allows fine-grained control over the request-reponse cycle.

Request middleware is called with details of the RPC request. Response
middleware, in addition to the response, is called with the originating
request object.

`Matcher` is either an RPC method, a regular expression, or the wildcard
matcher, the string `'*'`.

**Example**

In the following example, all requests sent through the module will
transparently JSON encode `CreateTransaction` requests in a format required by
the Zilliqa RPC server.

```typescript
// myMiddleware.js
// myMiddleware listens for CreateTransaction RPC requests, transforming
// `amount`, `gasLimit` and `gasPrice` to `string`, so that the RPC server will
// be able to process the transaction.
export function myMiddleware(req) {
  // This check is, in fact, not required if you make use of `Matcher`.
  if (
    req.payload.method === RPCMethod.CreateTransaction &&
    isTxParams(req.payload.params[0])
  ) {
    const txConfig = req.payload.params[0];

    const ret = {
      ...req,
      payload: {
        ...req.payload,
        params: [
          {
            ...txConfig,
            amount: txConfig.amount.toString(),
            gasLimit: txConfig.gasLimit.toString(),
            gasPrice: txConfig.gasPrice.toString(),
          },
        ],
      },
    };

    return ret;
  }

  return req;
}
```

```typescript
// myModule.js
import { myMiddleware } from './myMiddleware.js';

export class MyModule {
  // other code
  ...

  // use the middleware function. As `'CreateTransaction'` was passed as the
  // `Matcher`, myMiddleware will only be called on `CreateTransaction`
  // requests.
  constructor(provider: Provider) {
    this.provider = provider;
    this.provider.middleware.request.use(
      myMiddleware,
      'CreateTransaction',
    );
  }

  // other code
  ...
}

```

## `HTTPProvider`

Concrete `Provider`. Extends `BaseProvider`.

### Instance methods

### `send<P extends any[], R = any, E string>(method: RPCMethod, ...params: P): Promise<RPCResponse<R,E>>`

**Parameters**

- `method`: `RPCMethod` - a valid Zilliqa JSON-RPC method (`string`).
- `params`: `any[]` - an array of arbitrary parameters to send.

**Returns**

- `Promise<RPCResponse<R,E>>` - resolves with the reponse, or rejects with an error, if any.

# Decorators

## `sign`

Method decorator used to decorate methods whose _first_ argument is
`Signable`, i.e., have a `bytes` property.

**Example**

```typescript
  @sign
  async createTransaction(tx: Transaction): Promise<Transaction> {
    // `Transaction` satifies `Signable`.
    // As it is the first argument of `createTransaction`, `tx` is already
    // signed by the time `createTransaction` begins to execute.

    // code to send the transaction to the node or pass it on to another
    // method/function
  }
```
