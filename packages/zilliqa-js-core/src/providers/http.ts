import axios from 'axios';
import Mitt, {Emitter} from 'mitt';
import BaseProvider from './base';
import {
  RPCMethod,
  RPCRequest,
  RPCRequestPayload,
  RPCResponse,
  performRPC,
} from '../net';
import {composeMiddleware, MiddlewareFn} from '../util';
import {Provider, Subscriber, Subscribers} from '../types';

export default class HTTPProvider extends BaseProvider implements Provider {
  nodeURL: string;

  constructor(
    nodeURL: string,
    reqMiddleware: MiddlewareFn[] = [],
    resMiddleware: MiddlewareFn[] = [],
  ) {
    super(reqMiddleware, resMiddleware);
    this.nodeURL = nodeURL;
  }

  buildPayload<T>(method: RPCMethod, params: T): RPCRequest<T> {
    return {
      url: this.nodeURL,
      method,
      payload: {id: 1, jsonrpc: '2.0', params},
    };
  }

  send<P, R = any, E = string>(method: RPCMethod, params: P): Promise<P> {
    const tReq = composeMiddleware(...this.reqMiddleware);
    const tRes = composeMiddleware(...this.resMiddleware);

    const req = tReq(this.buildPayload(method, params));

    return performRPC(req, tRes);
  }

  subscribe(event: string, subscriber: Subscriber): Symbol {
    throw new Error('HTTPProvider does not support subscriptions.');
  }

  unsubscribe(token: symbol) {
    throw new Error('HTTPProvider does not support subscriptions.');
  }
}
