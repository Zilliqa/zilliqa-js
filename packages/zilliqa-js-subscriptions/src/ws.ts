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

import mitt from 'mitt';
import { w3cwebsocket as W3CWebsocket } from 'websocket';
import {
  MessageType,
  NewBlockQuery,
  NewEventQuery,
  QueryParam,
  SocketConnect,
  SocketState,
  StatusType,
  SubscriptionOption,
  Unsubscribe,
} from './types';

export class WebSocketProvider {
  public static NewWebSocket(
    url: string,
    options?: SubscriptionOption,
  ): WebSocket | W3CWebsocket {
    if (typeof window !== 'undefined' && (<any>window).WebSocket) {
      return new WebSocket(url, options !== undefined ? options.protocol : []);
    } else {
      const headers = options !== undefined ? options.headers || {} : undefined;
      const urlObject = new URL(url);
      if (
        headers !== undefined &&
        !headers.authorization &&
        urlObject.username &&
        urlObject.password
      ) {
        const authToken = Buffer.from(
          `${urlObject.username}:${urlObject.password}`,
        ).toString('base64');
        headers.authorization = `Basic ${authToken}`;
      }

      return new W3CWebsocket(
        url,
        options !== undefined ? options.protocol : undefined,
        undefined,
        headers,
        undefined,
        options !== undefined ? options.clientConfig : undefined,
      );
    }
  }

  url: string;
  options?: SubscriptionOption;
  emitter: mitt.Emitter;
  handlers: any = {};
  websocket: WebSocket | W3CWebsocket;

  subscriptions: any;

  // basically, options is a collection of metadata things like protocol or headers
  constructor(url: string, options?: SubscriptionOption) {
    this.url = url;
    this.options = options;
    this.emitter = new mitt(this.handlers);
    this.websocket = WebSocketProvider.NewWebSocket(url, options);
    this.subscriptions = {};
    this.registerEventListeners();
  }

  registerEventListeners() {
    this.websocket.onopen = this.onConnect.bind(this);
    this.websocket.onclose = this.onClose.bind(this);
    this.websocket.onmessage = this.onMessage.bind(this);
    this.websocket.onerror = this.onError.bind(this);
  }

  removeAllSocketListeners() {
    this.removeEventListener(SocketState.SOCKET_MESSAGE);
    this.removeEventListener(SocketState.SOCKET_READY);
    this.removeEventListener(SocketState.SOCKET_CLOSE);
    this.removeEventListener(SocketState.SOCKET_ERROR);
    this.removeEventListener(SocketState.SOCKET_CONNECT);
  }

  removeEventListener(type?: string, handler?: mitt.Handler) {
    if (!type) {
      this.handlers = {};
      return;
    }
    if (!handler) {
      delete this.handlers[type];
    } else {
      return this.emitter.off(type, handler);
    }
  }

  reconnect() {
    setTimeout(() => {
      this.removeAllSocketListeners();
      this.websocket = WebSocketProvider.NewWebSocket(this.url, this.options);
      this.registerEventListeners();
    }, 5000);
  }

  async onClose(event: CloseEvent) {
    // reconnect
    if (this.subscriptions !== null && !event.wasClean) {
      this.emitter.emit(SocketConnect.RECONNECT, event);
      this.reconnect();
      return;
    }

    // normal close
    if (this.websocket.CONNECTING) {
      this.emitter.emit(SocketConnect.CLOSE, event);
      this.websocket.close();
      return;
    }
  }

  onError(event: Event) {
    this.emitter.emit(SocketConnect.ERROR, event);
    if (this.websocket.CONNECTING) {
      this.websocket.close();
    }
    return;
  }

  async onConnect() {
    if (!this.subscriptions) {
      this.subscriptions = {};
    }
    // retry logic
    const subscriptionKeys = Object.keys(this.subscriptions);
    if (subscriptionKeys.length > 0) {
      for (const key of subscriptionKeys) {
        const id = key;
        const parameters = this.subscriptions[key].parameters;
        delete this.subscriptions[id];
        await this.subscribe(parameters);
      }
    }

    this.emitter.emit(SocketState.SOCKET_CONNECT);
    this.emitter.emit(SocketConnect.CONNECT);
  }

  onMessage(msg: MessageEvent) {
    if (msg.data) {
      const dataObj = JSON.parse(msg.data);
      if (dataObj.type === MessageType.NOTIFICATION) {
        this.emitter.emit(SocketState.SOCKET_MESSAGE, dataObj);
        for (const value of dataObj.values) {
          if (value.query === MessageType.NEW_BLOCK) {
            this.emitter.emit(MessageType.NEW_BLOCK, value);
          } else if (value.query === MessageType.EVENT_LOG) {
            this.emitter.emit(MessageType.EVENT_LOG, value);
          } else if (value.query === MessageType.UNSUBSCRIBE) {
            this.emitter.emit(MessageType.UNSUBSCRIBE, value);
          } else {
            throw new Error('unsupported value type');
          }
        }
      } else if (dataObj.query === QueryParam.NEW_BLOCK) {
        // subscribe NewBlock succeed
        this.subscriptions[dataObj.query] = {
          id: dataObj.query,
          parameters: dataObj,
        };
        this.emitter.emit(StatusType.SUBSCRIBE_NEW_BLOCK, dataObj);
        this.emitter.emit(SocketConnect.RECONNECT);
      } else if (dataObj.query === QueryParam.EVENT_LOG) {
        // subscribe EventLog succeed
        this.subscriptions[dataObj.query] = {
          id: dataObj.query,
          parameters: dataObj,
        };
        this.emitter.emit(StatusType.SUBSCRIBE_EVENT_LOG, dataObj);
        this.emitter.emit(SocketConnect.RECONNECT);
      } else if (dataObj.query === QueryParam.UNSUBSCRIBE) {
        this.emitter.emit(MessageType.UNSUBSCRIBE, dataObj);
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
        let queryParam;
        if (query.query === QueryParam.NEW_BLOCK) {
          queryParam = StatusType.SUBSCRIBE_NEW_BLOCK;
        } else if (query.query === QueryParam.EVENT_LOG) {
          queryParam = StatusType.SUBSCRIBE_EVENT_LOG;
        } else {
          queryParam = query.query;
        }
        this.emitter.on(queryParam, (data) => {
          resolve(data);
        });
        this.emitter.on(SocketConnect.ERROR, reject);
      }

      const connectHandler = () => {
        this.send(query).then(resolve).catch(reject);
      };

      const offConnectHandler = () => {
        this.emitter.off(SocketConnect.CONNECT, connectHandler);
      };
      this.emitter.on(SocketConnect.CONNECT, connectHandler);
      this.emitter.on(SocketConnect.RECONNECT, offConnectHandler);
    });
  }

  async subscribe(payload: NewBlockQuery | NewEventQuery): Promise<boolean> {
    const result = await this.send(payload);
    return result.query === payload.query;
  }

  async unsubscribe(payload: Unsubscribe): Promise<boolean> {
    const result = await this.send(payload);
    // todo handle separately
    const succeed = result.query === payload.query;
    if (succeed) {
      this.subscriptions[payload.query] = null;
    }
    return succeed;
  }
}
