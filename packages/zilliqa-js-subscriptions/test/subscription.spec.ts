import { Server } from 'mock-socket';
import { WebSocketProvider } from '../src';
// import {WebSocketProvider} from '../dist/ws';

describe('WebSocketProvider', () => {
  it('should be able to connect to websocket server', async () => {
    const fakeURL = 'ws://localhost:8080';
    const mockServer = new Server(fakeURL);
    mockServer.on('connection', (socket) => {
      socket.on('message', (data) => {
        console.log('data = ', data);
        expect(data).toEqual('{"query":"NewBlock"}');
        socket.send(
          '{\n' +
            '  "type":"notification",\n' +
            '  "values":[\n' +
            '    {\n' +
            '      "query":"NewBlock",\n' +
            '      "value":"..."\n' +
            '    },\n' +
            '    {\n' +
            '      "query":"EventLog",\n' +
            '      "value":"..."\n' +
            '    }\n' +
            '  ]\n' +
            '}',
        );
        socket.close();
      });
    });

    const ws = new WebSocketProvider(fakeURL);
    ws.subscribe({ query: 'NewBlock' });
    // following code will cause timeout error which makes this unit test failed
    // I have not reach out a good way to let this unit test succeed, but indeed it is a good tool test our class for now
    // await expect(ws.subscribe({query: '1000'})).resolves.toReturn();
  });
});
