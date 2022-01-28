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

import { BaseProvider } from './base';
import {
  RPCMethod,
  RPCRequest,
  RPCResponse,
  performRPC,
  performBatchRPC,
  RPCRequestPayload,
} from '../net';
import { composeMiddleware } from '../util';
import { Provider, Subscriber } from '../types';

export class HTTPProvider extends BaseProvider implements Provider {
  buildPayload<T extends any[]>(method: RPCMethod, params: T): RPCRequest<T> {
    return {
      url: this.nodeURL,
      payload: { id: 1, jsonrpc: '2.0', method, params },
    };
  }

  buildBatchPayload<T extends any[]>(
    method: RPCMethod,
    paramsList: T[],
  ): RPCRequest<T> {
    const payloads: RPCRequestPayload<T>[] = [];
    for (let i = 0; i < paramsList.length; i++) {
      // most of the payloads should be a single param, e.g. GetTransaction
      // however, there are special cases e.g. GetSmartContractSubState & GetTransactionsForTxBlockEx
      // where the param field is a list
      const payloadParams = paramsList[i];
      let params: any;
      if (Array.isArray(payloadParams)) {
        // for those param field that is already a list
        params = payloadParams;
      } else {
        params = [payloadParams];
      }
      // id start from index 1
      payloads.push({
        id: i + 1,
        jsonrpc: '2.0',
        method,
        params,
      });
    }
    return {
      url: this.nodeURL,
      payload: payloads,
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

  sendBatch<P extends any[], R = any, E = string>(
    method: RPCMethod,
    params: P[],
  ): Promise<RPCResponse<R, E>> {
    const [tReq, tRes] = this.getMiddleware(method);
    const reqMiddleware = composeMiddleware(...tReq);
    const resMiddleware = composeMiddleware(...tRes);

    const batchPayload = this.buildBatchPayload(method, params);

    const req = reqMiddleware(batchPayload);
    return performBatchRPC(req, resMiddleware);
  }

  subscribe(event: string, subscriber: Subscriber): symbol {
    throw new Error('HTTPProvider does not support subscriptions.');
  }

  unsubscribe(token: symbol) {
    throw new Error('HTTPProvider does not support subscriptions.');
  }
}
