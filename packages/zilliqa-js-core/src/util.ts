import { RPCMethod, RPCRequest, RPCResponse } from './net';

export type WithRequest<T, I = any> = T & { req: RPCRequest<I> };

export type Matcher = RPCMethod | '*' | RegExp;

export interface Middleware {
  request: {
    use: <I, O>(fn: ReqMiddlewareFn<I, O>, match?: Matcher) => void;
  };
  response: {
    use: <I, O, E>(fn: ResMiddlewareFn<I, O, E>, match?: Matcher) => void;
  };
}

export type Transformer<I, O> = (payload: I) => O;

export type ReqMiddlewareFn<I = any, O = any> = Transformer<
  RPCRequest<I>,
  RPCRequest<O>
>;
export type ResMiddlewareFn<I = any, O = any, E = any> = Transformer<
  WithRequest<RPCResponse<I, E>>,
  WithRequest<RPCResponse<O, E>>
>;

export function isValidResponse<T, E>(
  response: any,
): response is RPCResponse<T, E> {
  if (
    response.jsonrpc === '2.0' &&
    (response.id === '1' || response.id === 1) &&
    (response.error || response.result)
  ) {
    return true;
  }

  return false;
}

export function composeMiddleware<T extends ReqMiddlewareFn[]>(
  ...fns: T
): ReqMiddlewareFn;
export function composeMiddleware<T extends ResMiddlewareFn[]>(
  ...fns: T
): ResMiddlewareFn;
export function composeMiddleware(...fns: any[]): any {
  if (fns.length === 0) {
    return (arg: any) => arg;
  }

  if (fns.length === 1) {
    return fns[0];
  }

  return fns.reduce((a, b) => (arg: any) => a(b(arg)));
}
