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

import { HTTPProvider, RPCMethod } from '@zilliqa-js/core';
import {
  isValidChecksumAddress,
  randomBytes,
  toBech32Address,
  toChecksumAddress,
} from '@zilliqa-js/crypto';
import { BN, Long } from '@zilliqa-js/util';

import { Transaction } from '../src/transaction';
import { Wallet } from '../src/wallet';
import fetch, { MockParams } from 'jest-fetch-mock';

const provider = new HTTPProvider('https://mock.com');
const wallet = new Wallet(provider);

const generateChecksumAddress = () => toChecksumAddress(randomBytes(20));

describe('Transaction', () => {
  for (let i = 0; i < 10; i++) {
    wallet.create();
  }

  afterEach(() => {
    fetch.resetMocks();
  });

  it('should return a checksummed address from txParams', () => {
    const tx = new Transaction(
      {
        version: 0,
        toAddr: generateChecksumAddress(),
        amount: new BN(0),
        gasPrice: new BN(1000),
        gasLimit: Long.fromNumber(1000),
      },
      provider,
    );

    // FIXME: remove 0x when this is fixed on the core side
    expect(isValidChecksumAddress(tx.txParams.toAddr)).toBe(true);
  });

  it('should accept bech32 toAddr', () => {
    const b16 = toChecksumAddress(randomBytes(20));
    const b32 = toBech32Address(b16);

    const tx = new Transaction(
      {
        version: 0,
        toAddr: b32,
        amount: new BN(0),
        gasPrice: new BN(1000),
        gasLimit: Long.fromNumber(1000),
      },
      provider,
    );

    expect(isValidChecksumAddress(tx.txParams.toAddr)).toBe(true);
    expect(tx.txParams.toAddr).toEqual(b16);
  });

  it('should not accept normal address', () => {
    const addr = randomBytes(20);
    try {
      const tx = new Transaction(
        {
          version: 0,
          toAddr: addr,
          amount: new BN(0),
          gasPrice: new BN(1000),
          gasLimit: Long.fromNumber(1000),
        },
        provider,
      );
      console.log(tx.txParams);
    } catch (error) {
      if (error instanceof Error) {
        expect(error.message).toEqual(
          'Wrong address format, should be either bech32 or checksummed address',
        );
      }
    }
  });

  it('should poll and call queued handlers on confirmation', async () => {
    const responses = [
      {
        id: 1,
        jsonrpc: '2.0',
        result: {
          balance: '39999999000000000',
          nonce: 1,
        },
      },
      {
        id: 1,
        jsonrpc: '2.0',
        result: {
          TranID: 'some_hash',
          Info: 'Non-contract txn, sent to shard',
        },
      },
      {
        id: 1,
        jsonrpc: '2.0',
        result: {
          ID: 'some_hash',
          receipt: { cumulative_gas: 1000, success: true },
        },
      },
    ].map(
      (res) => [JSON.stringify(res), { status: 200 }] as [string, MockParams],
    );

    fetch.mockResponses(...responses);

    const pending = await wallet.sign(
      new Transaction(
        {
          version: 0,
          toAddr: '0x1234567890123456789012345678901234567890',
          amount: new BN(0),
          gasPrice: new BN(1000),
          gasLimit: Long.fromNumber(1000),
        },
        provider,
      ),
    );

    await provider.send(RPCMethod.CreateTransaction, pending.txParams);
    const confirmed = await pending.confirm('some_hash');
    const state = confirmed.txParams;

    expect(confirmed.isConfirmed()).toBeTruthy();
    expect(state.receipt).toEqual({ success: true, cumulative_gas: 1000 });
  });

  it('should reject the promise if there is a network error', async () => {
    fetch
      .once(
        JSON.stringify({
          id: 1,
          jsonrpc: '2.0',
          result: {
            balance: '39999999000000000',
            nonce: 1,
          },
        }),
      )
      .mockRejectOnce(new Error('something bad happened'));

    const tx = await wallet.sign(
      new Transaction(
        {
          version: 0,
          toAddr: '0x1234567890123456789012345678901234567890',
          amount: new BN(0),
          gasPrice: new BN(1000),
          gasLimit: Long.fromNumber(1000),
        },
        provider,
      ),
    );

    await expect(
      provider.send(RPCMethod.CreateTransaction, tx.txParams),
    ).rejects.toThrow();
  });

  it('should not reject the promise if receipt.success === false', async () => {
    const responses = [
      {
        id: 1,
        jsonrpc: '2.0',
        result: {
          balance: '39999999000000000',
          nonce: 1,
        },
      },
      {
        id: 1,
        jsonrpc: '2.0',
        result: {
          TranID: 'some_hash',
          Info: 'Non-contract txn, sent to shard',
        },
      },
      {
        id: 1,
        jsonrpc: '2.0',
        result: {
          ID: 'some_hash',
          receipt: { cumulative_gas: 1000, success: false },
        },
      },
    ].map(
      (res) => [JSON.stringify(res), { status: 200 }] as [string, MockParams],
    );

    fetch.mockResponses(...responses);

    const tx = await wallet.sign(
      new Transaction(
        {
          version: 0,
          toAddr: '0x1234567890123456789012345678901234567890',
          amount: new BN(0),
          gasPrice: new BN(1000),
          gasLimit: Long.fromNumber(1000),
        },
        provider,
      ),
    );

    const res = await provider.send(RPCMethod.CreateTransaction, tx.txParams);
    const rejected = await tx.confirm(res.result.TranID);

    await expect(
      rejected.txParams.receipt && rejected.txParams.receipt.success,
    ).toEqual(false);
  });

  it('should try for n attempts before timing out', async () => {
    const responses = [
      {
        id: 1,
        jsonrpc: '2.0',
        result: {
          balance: '39999999000000000',
          nonce: 1,
        },
      },
      {
        id: 1,
        jsonrpc: '2.0',
        result: {
          TranID: 'some_hash',
          Info: 'Non-contract txn, sent to shard',
        },
      },
      ...(() => {
        const mocks = [];

        for (let i = 0; i < 40; i++) {
          mocks.push({
            id: 1,
            jsonrpc: '2.0',
            error: {
              code: -888,
              message: 'Not found',
            },
          });
        }

        return mocks;
      })(),
      {
        id: 1,
        jsonrpc: '2.0',
        result: {
          ID: 'some_hash',
          receipt: { cumulative_gas: 1000, success: true },
        },
      },
    ].map(
      (res) => [JSON.stringify(res), { status: 200 }] as [string, MockParams],
    );

    fetch.mockResponses(...responses);

    const pending = await wallet.sign(
      new Transaction(
        {
          version: 0,
          toAddr: '0x1234567890123456789012345678901234567890',
          amount: new BN(0),
          gasPrice: new BN(1000),
          gasLimit: Long.fromNumber(1000),
        },
        provider,
      ),
    );

    await provider.send(RPCMethod.CreateTransaction, pending.txParams);

    await expect(pending.confirm('some_hash', 40, 0)).rejects.toThrow(
      'The transaction is still not confirmed after 40 attempts.',
    );
  });

  it('should use block confirm to confirm a txn', async () => {
    const responses = [
      {
        id: 1,
        jsonrpc: '2.0',
        result: {
          balance: '39999999000000000',
          nonce: 1,
        },
      },
      {
        id: 1,
        jsonrpc: '2.0',
        result: {
          TranID: 'some_hash',
          Info: 'Non-contract txn, sent to shard',
        },
      },
      {
        id: 1,
        jsonrpc: '2.0',
        result: {
          header: {
            BlockNum: '10000',
          },
        },
      },

      {
        id: 1,
        jsonrpc: '2.0',
        result: {
          header: {
            BlockNum: '10000',
          },
        },
      },
      {
        id: 1,
        jsonrpc: '2.0',
        error: {
          code: -888,
          message: 'Not found',
        },
      },
      {
        id: 1,
        jsonrpc: '2.0',
        result: {
          header: {
            BlockNum: '10001',
          },
        },
      },
      {
        id: 1,
        jsonrpc: '2.0',
        result: {
          ID: 'some_hash',
          receipt: { cumulative_gas: 1000, success: true },
        },
      },
    ].map(
      (res) => [JSON.stringify(res), { status: 200 }] as [string, MockParams],
    );

    fetch.mockResponses(...responses);
    const tx = await wallet.sign(
      new Transaction(
        {
          version: 0,
          toAddr: '0x1234567890123456789012345678901234567890',
          amount: new BN(0),
          gasPrice: new BN(1000),
          gasLimit: Long.fromNumber(1000),
        },
        provider,
      ),
    );

    const res = await provider.send(RPCMethod.CreateTransaction, tx.txParams);
    const confirmed = await tx.blockConfirm(res.result.TranID);
    const state = confirmed.txParams;

    expect(confirmed.isConfirmed()).toBeTruthy();
    expect(state.receipt).toEqual({ success: true, cumulative_gas: 1000 });
    expect(confirmed.blockConfirmation).toEqual(1);
  });

  it('should get hash without sending to network', async () => {
    const tx = new Transaction(
      {
        version: 21823489,
        nonce: 41,
        toAddr: 'zil124sjf3g7jnxua7wnx4egu0vcnm4nzlef5zcdu3',
        amount: new BN(100000000),
        pubKey:
          '026c7f3b8ac6f615c00c34186cbe4253a2c5acdc524b1cfae544c629d8e3564cfc',
        gasPrice: new BN(1000000000),
        gasLimit: Long.fromNumber(1),
        signature:
          '8bb3404b033b780421ae5d31b9e130161e58e750ca052ab07d9f71924d0353d525353ef6217b4c56303c7434245110c0e0faa578c6d993c2b91b5c8574b79cf7',
      },
      provider,
    );

    expect(tx.hash).toEqual(
      'f0f1cefeed3e6124e80eadc668908a89fb45d130c90619004589b1c726fb178f',
    );
  });

  it('should use block confirm to reject a txn', async () => {
    const responses = [
      {
        id: 1,
        jsonrpc: '2.0',
        result: {
          balance: '39999999000000000',
          nonce: 1,
        },
      },
      {
        id: 1,
        jsonrpc: '2.0',
        result: {
          TranID: 'some_hash',
          Info: 'Non-contract txn, sent to shard',
        },
      },
      {
        id: 1,
        jsonrpc: '2.0',
        result: {
          header: {
            BlockNum: '10001',
          },
        },
      },

      {
        id: 1,
        jsonrpc: '2.0',
        result: {
          header: {
            BlockNum: '10001',
          },
        },
      },
      {
        id: 1,
        jsonrpc: '2.0',
        error: {
          code: -888,
          message: 'Not found',
        },
      },
      {
        id: 1,
        jsonrpc: '2.0',
        result: {
          header: {
            BlockNum: '10002',
          },
        },
      },
      {
        id: 1,
        jsonrpc: '2.0',
        error: {
          code: -888,
          message: 'Not found',
        },
      },
      {
        id: 1,
        jsonrpc: '2.0',
        result: {
          header: {
            BlockNum: '10003',
          },
        },
      },
      {
        id: 1,
        jsonrpc: '2.0',
        error: {
          code: -888,
          message: 'Not found',
        },
      },
      {
        id: 1,
        jsonrpc: '2.0',
        result: {
          header: {
            BlockNum: '10004',
          },
        },
      },
      {
        id: 1,
        jsonrpc: '2.0',
        error: {
          code: -888,
          message: 'Not found',
        },
      },
      {
        id: 1,
        jsonrpc: '2.0',
        result: {
          header: {
            BlockNum: '10004',
          },
        },
      },
    ].map(
      (res) => [JSON.stringify(res), { status: 200 }] as [string, MockParams],
    );

    fetch.mockResponses(...responses);
    const tx = await wallet.sign(
      new Transaction(
        {
          version: 0,
          toAddr: '0x1234567890123456789012345678901234567890',
          amount: new BN(0),
          gasPrice: new BN(1000),
          gasLimit: Long.fromNumber(1000),
        },
        provider,
      ),
    );

    const res = await provider.send(RPCMethod.CreateTransaction, tx.txParams);

    await expect(tx.blockConfirm(res.result.TranID, 4, 1000)).rejects.toThrow(
      'The transaction is still not confirmed after 4 blocks.',
    );
  });

  it('should not have error if offline sign is false', async () => {
    const responses = [
      {
        id: 1,
        jsonrpc: '2.0',
        result: {
          TranID: 'some_hash',
          Info: 'Non-contract txn, sent to shard',
        },
      },
      {
        id: 1,
        jsonrpc: '2.0',
        result: {
          ID: 'some_hash',
          receipt: { cumulative_gas: 1000, success: true },
        },
      },
    ].map(
      (res) => [JSON.stringify(res), { status: 200 }] as [string, MockParams],
    );

    fetch.mockResponses(...responses);

    const tx = new Transaction(
      {
        version: 1,
        nonce: 1,
        toAddr: '0x1234567890123456789012345678901234567890',
        amount: new BN(0),
        gasPrice: new BN(1000),
        gasLimit: Long.fromNumber(1000),
      },
      provider,
    );

    const pending = await wallet.sign(tx, false);
    await provider.send(RPCMethod.CreateTransaction, pending.txParams);
    const confirmed = await pending.confirm('some_hash');
    const state = confirmed.txParams;

    expect(confirmed.isConfirmed()).toBeTruthy();
    expect(state.receipt).toEqual({ success: true, cumulative_gas: 1000 });
  });

  it('should not have error if offline sign is explicit false', async () => {
    const responses = [
      {
        id: 1,
        jsonrpc: '2.0',
        result: {
          balance: '39999999000000000',
          nonce: 1,
        },
      },
      {
        id: 1,
        jsonrpc: '2.0',
        result: {
          TranID: 'some_hash',
          Info: 'Non-contract txn, sent to shard',
        },
      },
      {
        id: 1,
        jsonrpc: '2.0',
        result: {
          ID: 'some_hash',
          receipt: { cumulative_gas: 1000, success: true },
        },
      },
    ].map(
      (res) => [JSON.stringify(res), { status: 200 }] as [string, MockParams],
    );

    fetch.mockResponses(...responses);

    const tx = new Transaction(
      {
        version: 1,
        toAddr: '0x1234567890123456789012345678901234567890',
        amount: new BN(0),
        gasPrice: new BN(1000),
        gasLimit: Long.fromNumber(1000),
      },
      provider,
    );

    const pending = await wallet.sign(tx, false); // explicit FALSE
    await provider.send(RPCMethod.CreateTransaction, pending.txParams);
    const confirmed = await pending.confirm('some_hash');
    const state = confirmed.txParams;

    expect(confirmed.isConfirmed()).toBeTruthy();
    expect(state.receipt).toEqual({ success: true, cumulative_gas: 1000 });
  });
});
