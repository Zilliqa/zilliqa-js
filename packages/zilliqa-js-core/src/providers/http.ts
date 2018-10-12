import axios from 'axios';
import Mitt, {Emitter} from 'mitt';
import {
  RPCRequest,
  RPCResponse,
  Provider,
  Subscriber,
  Subscribers,
} from '../types';

export default class HTTPProvider implements Provider {
  nodeURL: string;

  constructor(nodeURL: string) {
    this.nodeURL = nodeURL;
  }

  buildPayload(method: string, payload: any): RPCRequest {
    return {jsonrpc: '2.0', method, params: payload, id: 1};
  }

  send<R = any, E = string>(method: string, payload: any) {
    return axios
      .post<RPCResponse<R, E>>(this.nodeURL, this.buildPayload(method, payload))
      .then(response => {
        return response.data;
      });
  }

  subscribe(event: string, subscriber: Subscriber): Symbol {
    throw new Error('HTTPProvider does not support subscriptions.');
  }

  unsubscribe(token: symbol) {
    throw new Error('HTTPProvider does not support subscriptions.');
  }
}
