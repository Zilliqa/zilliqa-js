import { Server } from 'mock-socket';
import { WebSocketProvider } from '../src';
// import {WebSocketProvider} from '../dist/ws';

describe('WebSocketProvider', () => {
  it('should be able to subscribe NewBlock', async () => {
    const fakeURL = 'ws://localhost:8080';
    const mockServer = new Server(fakeURL);
    mockServer.on('connection', (socket) => {
      socket.on('message', (data) => {
        console.log('data = ', data);
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
});
