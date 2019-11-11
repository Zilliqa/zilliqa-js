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

import mitt from 'mitt';
import { w3cwebsocket as W3CWebsocket } from 'websocket';
import {
  EventType,
  NewBlockQuery,
  NewEventQuery,
  SocketConnect,
  SocketState,
  UnsubscribeEventLog,
  UnsubscribeNewBlock,
} from './types';

export class WebSocketProvider {
  public static NewWebSocket(
    url: string,
    options: any = {},
  ): WebSocket | W3CWebsocket {
    // tslint:disable-next-line: no-string-literal
    if (typeof window !== 'undefined' && (<any>window).WebSocket) {
      // tslint:disable-next-line: no-string-literal
      return new WebSocket(url, options.protocol);
    } else {
      const headers = options.headers || {};
      const urlObject = new URL(url);

      if (!headers.authorization && urlObject.username && urlObject.password) {
        const authToken = Buffer.from(
          `${urlObject.username}:${urlObject.password}`,
        ).toString('base64');
        headers.authorization = `Basic ${authToken}`;
      }

      return new W3CWebsocket(
        url,
        options.protocol,
        undefined,
        headers,
        undefined,
        options.clientConfig,
      );
    }
  }

  url: string;
  emitter: mitt.Emitter;
  handlers: any = {};
  websocket: WebSocket | W3CWebsocket;
  // use concrete object instead of `any`
  subscriptions: any;

  // basically, options is a collection of metadata things like protocol or headers
  constructor(url: string, options: any = {}) {
    this.url = url;
    this.emitter = mitt(this.handlers);
    this.websocket = WebSocketProvider.NewWebSocket(url, options);
    this.subscriptions = {};
    this.websocket.onopen = this.onConnect.bind(this);
    this.websocket.onclose = this.onClose.bind(this);
    this.websocket.onmessage = this.onMessage.bind(this);
  }

  onClose(event: any) {
    // todo impl this
    console.log('close: ', event);
    if (this.websocket.CONNECTING) {
      this.websocket.close();
    }
    return;
  }

  onError(event: any) {
    // todo impl this
    console.log('close: ', event);
    return;
  }

  async onConnect() {
    if (!this.subscriptions) {
      this.subscriptions = {};
    }
    // todo handle reconnect issue
    this.emitter.emit(SocketState.SOCKET_CONNECT);
    this.emitter.emit(SocketConnect.CONNECT);
  }

  onMessage(msg: MessageEvent) {
    if (msg.data) {
      const dataObj = JSON.parse(msg.data);
      if (dataObj.type === EventType.NOTIFICATION) {
        this.emitter.emit(SocketState.SOCKET_MESSAGE, dataObj);
        for (const value of dataObj.values) {
          if (value.query === 'NewBlock') {
            this.emitter.emit(EventType.NEW_BLOCK, value);
          } else if (value.query === 'EventLog') {
            this.emitter.emit(EventType.EVENT_LOG, value);
          } else {
            throw new Error('unsupported value type');
          }
        }
      } else if (dataObj.query === EventType.NEW_BLOCK) {
        // subscribe NewBlock succeed
        this.subscriptions[dataObj.query] = {
          id: dataObj.query,
          parameters: dataObj,
        };
        this.emitter.emit(EventType.NEW_BLOCK, dataObj);
      } else if (dataObj.query === EventType.EVENT_LOG) {
        // subscribe EventLog succeed
        this.subscriptions[dataObj.query] = {
          id: dataObj.query,
          parameters: dataObj,
        };
        this.emitter.emit(EventType.EVENT_LOG, dataObj);
      } else if (dataObj.query === EventType.UNSUBSCRIBE) {
        this.emitter.emit(EventType.UNSUBSCRIBE, dataObj);
      } else {
        throw new Error('unsupported message type');
      }
    } else {
      throw new Error('message data is empty');
    }
  }

  addEventListener(type: string, handler: mitt.Handler) {
    this.emitter.on(type, handler);
  }

  removeEventListener(type: string, handler: mitt.Handler) {
    this.emitter.off(type, handler);
  }

  connecting() {
    return this.websocket.readyState === this.websocket.CONNECTING;
  }

  send(query: NewBlockQuery | NewEventQuery): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.connecting()) {
        try {
          this.websocket.send(JSON.stringify(query));
        } catch (error) {
          throw error;
        }
        this.emitter.on(query.query, (data) => {
          resolve(data);
        });
        this.emitter.on(SocketConnect.ERROR, reject);
      }
      // may be emitted inside onConnect
      this.emitter.on(SocketConnect.CONNECT, () => {
        this.send(query)
          .then(resolve)
          .catch(reject);
      });
    });
  }

  async subscribe(payload: NewBlockQuery | NewEventQuery): Promise<boolean> {
    const result = await this.send(payload);
    return result.query === payload.query;
  }

  async unsubscribe(
    payload: UnsubscribeNewBlock | UnsubscribeEventLog,
  ): Promise<boolean> {
    const result = await this.send(payload);
    const succeed = result.query === payload.query;
    if (succeed) {
      this.subscriptions[payload.query] = null;
    }
    return succeed;
  }
}
