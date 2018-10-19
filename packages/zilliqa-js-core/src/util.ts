import {RPCRequest, RPCResponse} from './net';
export interface Middleware {
  request: {
    use: <I, O>(fn: ReqMiddlewareFn<I, O>) => void;
  };
  response: {
    use: <I, O, E>(fn: ResMiddlewareFn<I, O, E>) => void;
  };
}
export type Transformer<I, O> = (payload: I) => O;
export type ReqMiddlewareFn<I = any, O = any> = Transformer<
  RPCRequest<I>,
  RPCRequest<O>
>;
export type ResMiddlewareFn<I = any, O = any, E = any> = Transformer<
  RPCResponse<I, E>,
  RPCResponse<O, E>
>;

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
