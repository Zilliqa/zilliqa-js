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

export type QueryParam = 'NewBlock' | 'EventLog';

export const enum SocketConnect {
  READY = 'ready',
  CONNECT = 'connect',
  ERROR = 'error',
  CLOSE = 'close',
}

export const enum SocketState {
  SOCKET_CONNECT = 'socket_connect',
  SOCKET_MESSAGE = 'socket_message',
  SOCKET_READY = 'socket_ready',
  SOCKET_CLOSE = 'socket_close',
  SOCKET_ERROR = 'socket_error',
}

export const enum EventType {
  NEW_BLOCK = 'NewBlock',
  EVENT_LOG = 'EventLog',
  NOTIFICATION = 'notification',
  UNSUBSCRIBE = 'Unsubscribe',
}

export interface NewBlockQuery {
  query: string;
}

export interface NewEventQuery {
  query: string;
  addresses: string[];
}

export interface UnsubscribeNewBlock {
  query: 'Unsubscribe';
  type: 'NewBlock';
}

export interface UnsubscribeEventLog {
  query: 'Unsubscribe';
  type: 'EventLog';
}
