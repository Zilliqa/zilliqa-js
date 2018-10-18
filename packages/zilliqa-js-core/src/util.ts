import {RPCRequest, RPCResponse} from './net';
interface Middleware {
  // use(fn: MiddlewareFn): void;
}

export type Transformer<I, O> = (payload: I) => O;
export type ReqMiddlewareFn<I, O> = Transformer<RPCRequest<I>, RPCRequest<O>>;
export type ResMiddlewareFn<I, O, E> = Transformer<
  RPCResponse<I, E>,
  RPCResponse<O, E>
>;
export type MiddlewareFn<I, O, E> =
  | ReqMiddlewareFn<I, O>
  | ResMiddlewareFn<I, O, E>;

export const composeMiddleware = <T extends Transformer<I, O>, I, O>(
  ...fns: T[]
): T => {
  if (fns.length === 0) {
    return ((arg: any) => arg) as T;
  }

  if (fns.length === 1) {
    return fns[0];
  }

  return fns.reduce((a, b) => (arg: I) => a(b(arg)));
};
