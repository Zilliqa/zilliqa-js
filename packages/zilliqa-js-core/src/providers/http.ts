//  This file is part of Zilliqa-Javascript-Library.
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//   This program is distributed in the hope that it will be useful,
//   but WITHOUT ANY WARRANTY; without even the implied warranty of
//   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//   GNU General Public License for more details.
//
//   You should have received a copy of the GNU General Public License
//   along with this program.  If not, see <https://www.gnu.org/licenses/>.

import { BaseProvider } from './base';
import { RPCMethod, RPCRequest, RPCResponse, performRPC } from '../net';
import { composeMiddleware } from '../util';
import { Provider, Subscriber } from '../types';

export class HTTPProvider extends BaseProvider implements Provider {
  buildPayload<T extends any[]>(method: RPCMethod, params: T): RPCRequest<T> {
    return {
      url: this.nodeURL,
      payload: { id: 1, jsonrpc: '2.0', method, params },
    };
  }

  send<P extends any[], R = any, E = string>(
    method: RPCMethod,
    ...params: P
  ): Promise<RPCResponse<R, E>> {
    const [tReq, tRes] = this.getMiddleware(method);
    const reqMiddleware = composeMiddleware(...tReq);
    const resMiddleware = composeMiddleware(...tRes);

    const req = reqMiddleware(this.buildPayload(method, params));

    return performRPC(req, resMiddleware);
  }

  subscribe(event: string, subscriber: Subscriber): symbol {
    throw new Error('HTTPProvider does not support subscriptions.');
  }

  unsubscribe(token: symbol) {
    throw new Error('HTTPProvider does not support subscriptions.');
  }
}
