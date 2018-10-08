import axios from 'axios';
import BN from 'bn.js';
import MockAdapter from 'axios-mock-adapter';
import {HTTPProvider} from 'zilliqa-js-core';

import Transaction from '../src/transaction';
import Wallet from '../src/wallet';

const mock = new MockAdapter(axios);
const provider = new HTTPProvider('https://mock.com');
const wallet = new Wallet(provider);

describe('Transaction', () => {
  for (let i = 0; i < 10; i++) {
    wallet.create();
  }

  // set mock provider on Transaction
  Transaction.setProvider(provider);

  afterEach(() => {
    mock.reset();
  });

  it('should poll and call queued handlers on confirmation', async () => {
    mock.onPost().reply(200, {
      result: {nonce: 1},
    });

    const pending = await wallet.sign(
      new Transaction({
        version: 0,
        to: '0x1234567890123456789012345678901234567890',
        amount: new BN(0),
        gasPrice: 1000,
        gasLimit: 1000,
      }),
    );

    mock.onPost().reply(200, {
      result: {
        TranID: 'some_hash',
      },
    });
    const response = await provider.send('CreateTransaction', pending.txParams);

    mock.onPost().reply(200, {
      result: {
        ID: 'some_hash',
        receipt: {
          success: true,
          cumulative_gas: 1000,
        },
      },
    });

    const confirmed = await pending.confirm('some_hash');
    const state = confirmed.txParams;

    expect(confirmed.isConfirmed()).toBeTruthy();
    expect(state.id).toEqual('some_hash');
    expect(state.receipt).toEqual({success: true, cumulative_gas: 1000});
  });

  it('should be awaitable', () => {});

  it('should call rejection handlers', async () => {
    mock.onPost().reply(200, {
      result: {nonce: 1},
    });
    const tx = await wallet.sign(
      new Transaction({
        version: 0,
        to: '0x1234567890123456789012345678901234567890',
        amount: new BN(0),
        gasPrice: 1000,
        gasLimit: 1000,
      }),
    );

    mock.onPost().reply(200, {
      result: {
        TranID: 'some_hash',
      },
    });
    const response = await provider.send('CreateTransaction', tx.txParams);

    const spy = jest.fn();
    mock.onPost().reply(400);
    try {
      tx.confirm('some_hash');
    } catch (err) {
      expect(err).toBeDefined;
    }
  });
});
