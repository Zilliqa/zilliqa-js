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

import fetch, { MockParams } from 'jest-fetch-mock';
import { RPCMethod } from '../src/net';
import { HTTPProvider } from '../src/providers/http';

import { mockReqMiddleware, mockResMiddleware } from './mockMiddleware';

const http = new HTTPProvider('https://mock-provider.com');

describe('HTTPProvider', () => {
  beforeEach(() => fetch.resetMocks());

  it('should send payload in the right jsonrpc format', async () => {
    fetch.once(JSON.stringify({ data: 'something' }));

    await http.send(RPCMethod.CreateTransaction, 'MyParam');
    const body = fetch.mock.calls[0][1]?.body as string;
    const payload = JSON.parse(body);

    expect(fetch).toHaveBeenCalled();
    expect(payload).toMatchObject({
      id: 1,
      jsonrpc: '2.0',
      method: RPCMethod.CreateTransaction,
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

    fetch.mockResponseOnce(JSON.stringify({ data: 'something' }));
    await withMiddleware.send(RPCMethod.CreateTransaction, 'first param');

    const body = fetch.mock.calls[0][1]?.body as string;
    const payload = JSON.parse(body);
    expect(payload).toMatchObject({
      id: 1,
      jsonrpc: '2.0',
      method: RPCMethod.CreateTransaction,
      params: ['first param', 'I am a test'],
    });
  });

  it('should use middleware to transform incoming responses', async () => {
    const withMiddleware = new HTTPProvider('https://mock-provider.com');
    withMiddleware.middleware.response.use(mockResMiddleware);

    fetch.mockResponseOnce(
      JSON.stringify({
        jsonrpc: '2.0',
        id: '1',
        result: 'something',
      }),
    );
    const res = await withMiddleware.send(
      RPCMethod.CreateTransaction,
      'some param',
    );

    expect(res.result).toEqual('SOMETHING');
  });

  it('should select only matching middleware', async () => {
    const spyReqMiddleware = jest.fn((x) => x);
    const spyResMiddleware = jest.fn((x) => x);
    const spyAllReq = jest.fn((x) => x);
    const spyAllRes = jest.fn((x) => x);

    const withMiddleware = new HTTPProvider('https://mock-provider.com');
    withMiddleware.middleware.request.use(
      spyReqMiddleware,
      RPCMethod.GetTransaction,
    );
    withMiddleware.middleware.response.use(
      spyResMiddleware,
      RPCMethod.GetBalance,
    );

    withMiddleware.middleware.request.use(spyAllReq, '*');
    withMiddleware.middleware.response.use(spyAllRes, '*');

    const responses = [
      {
        id: 1,
        jsonrpc: '2.0',
        result: {
          ID: 'some_hash',
          receipt: { success: true },
        },
      },
      {
        id: 1,
        jsonrpc: '2.0',
        result: {
          balance: 888,
          nonce: 1,
        },
      },
    ].map(
      (res) => [JSON.stringify(res), { status: 200 }] as [string, MockParams],
    );

    fetch.mockResponses(...responses);
    await withMiddleware.send(RPCMethod.GetTransaction, 'some_hash');
    await withMiddleware.send(RPCMethod.GetBalance, 'some_hash');

    expect(spyReqMiddleware).toHaveBeenCalledTimes(1);
    expect(spyResMiddleware).toHaveBeenCalledTimes(1);
    expect(spyAllReq).toHaveBeenCalledTimes(2);
    expect(spyAllRes).toHaveBeenCalledTimes(2);
  });
});
