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
