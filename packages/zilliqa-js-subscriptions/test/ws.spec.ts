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

import { Server } from 'mock-socket';
import { WebSocketProvider } from '../src';

describe('WebSocketProvider', () => {
  it('should be able to subscribe NewBlock', async () => {
    const fakeURL = 'ws://localhost:8080';
    const mockServer = new Server(fakeURL);
    mockServer.on('connection', (socket) => {
      socket.on('message', (data) => {
        expect(data).toEqual('{"query":"NewBlock"}');
        socket.send(data);
        socket.close();
      });
    });
    const ws = new WebSocketProvider(fakeURL);
    await expect(ws.subscribe({ query: 'NewBlock' })).resolves.toEqual(true);
  });

  it('should able to subscribe Event Log', async () => {
    const fakeURL = 'ws://localhost:8081';
    const mockServer = new Server(fakeURL);
    mockServer.on('connection', (socket) => {
      socket.on('message', (data) => {
        socket.send(data);
        socket.close();
      });
    });
    const ws = new WebSocketProvider(fakeURL);
    await expect(
      ws.subscribe({
        query: 'EventLog',
        addresses: [
          '0x0000000000000000000000000000000000000000',
          '0x1111111111111111111111111111111111111111',
        ],
      }),
    ).resolves.toEqual(true);
  });

  it('should be able to unsubscribe New Block', async () => {
    const fakeURL = 'ws://localhost:8082';
    const mockServer = new Server(fakeURL);
    mockServer.on('connection', (socket) => {
      socket.on('message', (data) => {
        const d =
          '{\n' +
          '  "query":"Unsubscribe",\n' +
          '  "value":["NewBlock"]\n' +
          '}';
        socket.send(d);
        socket.close();
      });
    });
    const ws = new WebSocketProvider(fakeURL);
    await expect(
      ws.unsubscribe({
        query: 'Unsubscribe',
        type: 'NewBlock',
      }),
    ).resolves.toEqual(true);
  });
});
