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

import { IClientConfig } from 'websocket';

export enum SocketConnect {
  READY = 'ready',
  CONNECT = 'connect',
  ERROR = 'error',
  CLOSE = 'close',
  RECONNECT = 'reconnect',
}

export enum SocketState {
  SOCKET_CONNECT = 'socket_connect',
  SOCKET_MESSAGE = 'socket_message',
  SOCKET_READY = 'socket_ready',
  SOCKET_CLOSE = 'socket_close',
  SOCKET_ERROR = 'socket_error',
}

// message type pushed by server side
export enum MessageType {
  NEW_BLOCK = 'NewBlock',
  EVENT_LOG = 'EventLog',
  NOTIFICATION = 'Notification',
  UNSUBSCRIBE = 'Unsubscribe',
}

// message type that we can query with to server
export enum QueryParam {
  NEW_BLOCK = 'NewBlock',
  EVENT_LOG = 'EventLog',
  UNSUBSCRIBE = 'Unsubscribe',
}

// indicate that whether we subscribe successfully
export enum StatusType {
  SUBSCRIBE_NEW_BLOCK = 'SubscribeNewBlock',
  SUBSCRIBE_EVENT_LOG = 'SubscribeEventLog',
}

export interface NewBlockQuery {
  query: string;
}

export interface NewEventQuery {
  query: string;
  addresses: string[];
}

export interface Unsubscribe {
  query: string;
  type: string;
}

export interface SubscriptionOption {
  addresses?: string[];
  clientConfig?: IClientConfig;
  headers?: {
    authorization?: string;
  };
  protocol?: string;
  protocols?: string | string[];
}
