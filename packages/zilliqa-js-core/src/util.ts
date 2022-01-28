//  Copyright (C) 2018 Zilliqa
//
//  This file is part of zilliqa-js
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU General Public License for more details.
//
//  You should have received a copy of the GNU General Public License
//  along with this program.  If not, see <https://www.gnu.org/licenses/>.

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
