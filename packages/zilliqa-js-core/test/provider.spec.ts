import fetch from 'jest-fetch-mock';
import {RPCMethod} from '../src/net';
import HTTPProvider from '../src/providers/http';

import {mockReqMiddleware} from './mockMiddleware';

const http = new HTTPProvider('https://mock-provider.com');

describe('HTTPProvider', () => {
  beforeEach(() => fetch.resetMocks());

  it('should send payload in the right jsonrpc format', async () => {
    fetch.once(JSON.stringify({data: 'something'}));

    const res = await http.send(RPCMethod.CreateTransaction, 'MyParam');
    const payload = JSON.parse(fetch.mock.calls[0][1].body);

    expect(fetch).toHaveBeenCalled();
    expect(payload).toMatchObject({
      id: 1,
      jsonrpc: '2.0',
      params: ['MyParam'],
    });
  });

  it('should throw an error if subscribe/unsubscribe are called', () => {
    const spy = jest.fn();
    expect(http.subscribe).toThrow;
    expect(http.unsubscribe).toThrow;
    expect(spy).not.toHaveBeenCalled();
  });

  it('should use middleware to transform outgoing requests', async () => {
    const withMiddleware = new HTTPProvider('https://mock-provider.com');
    withMiddleware.middleware.request.use(mockReqMiddleware);

    fetch.mockResponseOnce(JSON.stringify({data: 'something'}));
    const res = await withMiddleware.send(
      RPCMethod.CreateTransaction,
      'first param',
    );

    const payload = JSON.parse(fetch.mock.calls[0][1].body);
    expect(payload).toMatchObject({
      id: 1,
      jsonrpc: '2.0',
      params: ['first param', 'I am a test'],
    });
  });
});
