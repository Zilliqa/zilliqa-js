import BN from 'bn.js';
import { RPCMethod, HTTPProvider } from '@zilliqa-js/core';

import { Transaction } from '../src/transaction';
import { Wallet } from '../src/wallet';

import fetch from 'jest-fetch-mock';

const provider = new HTTPProvider('https://mock.com');
const wallet = new Wallet(provider);

describe('Transaction', () => {
  for (let i = 0; i < 10; i++) {
    wallet.create();
  }

  afterEach(() => {
    fetch.resetMocks();
  });

  it('should poll and call queued handlers on confirmation', async () => {
    const responses = [
      {
        id: 1,
        jsonrpc: '2.0',
        result: {
          balance: 888,
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
          receipt: { cumulative_gas: '1000', success: true },
        },
      },
    ].map((res) => [JSON.stringify(res)] as [string]);

    fetch.mockResponses(...responses);

    const pending = await wallet.sign(
      new Transaction(
        {
          version: 0,
          toAddr: '0x1234567890123456789012345678901234567890',
          amount: new BN(0),
          gasPrice: new BN(1000),
          gasLimit: new BN(1000),
        },
        provider,
      ),
    );

    await provider.send(RPCMethod.CreateTransaction, pending.txParams);
    const confirmed = await pending.confirm('some_hash');
    const state = confirmed.txParams;

    expect(confirmed.isConfirmed()).toBeTruthy();
    expect(state.receipt).toEqual({ success: true, cumulative_gas: '1000' });
  });

  it('should reject the promise if there is a network error', async () => {
    fetch
      .once(
        JSON.stringify({
          id: 1,
          jsonrpc: '2.0',
          result: {
            balance: 888,
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
          gasLimit: new BN(1000),
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
          balance: 888,
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
          receipt: { cumulative_gas: '1000', success: false },
        },
      },
    ].map((res) => [JSON.stringify(res)] as [string]);

    fetch.mockResponses(...responses);

    const tx = await wallet.sign(
      new Transaction(
        {
          version: 0,
          toAddr: '0x1234567890123456789012345678901234567890',
          amount: new BN(0),
          gasPrice: new BN(1000),
          gasLimit: new BN(1000),
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
});
