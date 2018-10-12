import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import HTTPProvider from '../src/providers/http';

const http = new HTTPProvider('https://mock-provider.com');
const mock = new MockAdapter(axios);

describe('HTTPProvider', () => {
  it('should send payload in the right jsonrpc format', done => {
    mock.onPost().reply(config => {
      expect(JSON.parse(config.data)).toMatchObject({
        jsonrpc: '2.0',
        method: 'MyMethod',
        params: 'MyParam',
        id: 1,
      });

      done();
      return [200];
    });

    http.send('MyMethod', 'MyParam');
  });

  it('should throw an error if subscribe/unsubscribe are called', () => {
    const spy = jest.fn();
    expect(http.subscribe).toThrow;
    expect(http.unsubscribe).toThrow;
    expect(spy).not.toHaveBeenCalled();
  });
});
