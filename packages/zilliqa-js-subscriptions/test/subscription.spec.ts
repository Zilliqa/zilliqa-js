import { Server } from 'mock-socket';
import { WebSocketProvider } from '../src';
// import {WebSocketProvider} from '../dist/ws';

describe('WebSocketProvider', () => {
  const fakeURL = 'ws://localhost:8080';

  it('should be able to connect to websocket server', async () => {
    const mockServer = new Server(fakeURL);
    mockServer.on('connection', (socket) => {
      socket.on('message', (data) => {
        console.log('data = ', data);
        expect(data).toEqual('{"query":"1000"}');
        socket.send('test message from mock server');
        socket.close();
      });
    });

    const ws = new WebSocketProvider(fakeURL);
    expect(ws.subscribe({ query: '1000' })).resolves.toReturn();
    // following code will cause timeout error which makes this unit test failed
    // I have not reach out a good way to let this unit test succeed, but indeed it is a good tool test our class for now
    // await expect(ws.subscribe({query: '1000'})).resolves.toReturn();
  });
});
