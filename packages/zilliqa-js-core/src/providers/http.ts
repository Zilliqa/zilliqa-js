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
  broadcaster: Emitter;
  subscribers: Subscribers = new Map();

  constructor(nodeURL: string) {
    this.nodeURL = nodeURL;
    this.broadcaster = new Mitt();
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

  subscribe(event: string, subscriber: Subscriber) {
    const subToken = Symbol();
    this.subscribers.set(subToken, subscriber);
    return subToken;
  }

  unsubscribe(token: symbol) {
    if (this.subscribers.has(token)) {
      this.subscribers.delete(token);
    }
  }
}
