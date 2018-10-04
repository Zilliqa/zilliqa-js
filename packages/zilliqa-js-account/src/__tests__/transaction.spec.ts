import mockAxios from 'jest-mock-axios';
import {HTTPProvider} from 'zilliqa-js-core';
import * as zcrypto from 'zilliqa-js-crypto';
import BN from 'bn.js';

import Transaction from '../transaction';
import Wallet from '../wallet';

describe('Module: Transaction', () => {
  // set up mock provider
  const provider = new HTTPProvider('https://mock.com');
  const wallet = new Wallet(provider);
  for (let i = 0; i < 10; i++) {
    wallet.create();
  }

  // set mock provider on Transaction
  Transaction.setProvider(provider);

  afterEach(() => {
    mockAxios.reset();
  });

  it('should poll and call queued handlers on confirmation', () => {
    const tx = wallet.sign(
      new Transaction({
        version: 1,
        nonce: 1,
        to: '0x1234567890123456789012345678901234567890',
        amount: new BN(0),
        gasPrice: 1000,
        gasLimit: 1000,
      }),
    );
    mockAxios.mockResponse({data: {result: {nonce: 1}}});

    tx.then(tx => {
      provider.send('CreateTransaction', tx.return());
      mockAxios.mockResponse({
        data: {
          result: {
            TranID: 'some_hash',
          },
        },
      });

      return tx;
    });

    return tx.then(tx => {
      tx.confirmReceipt('some_hash').map(txObj => {
        expect(txObj.id).toEqual('some_hash');
        expect(txObj.receipt).toEqual({succcess: true, cumulative_gas: 1000});
        expect(tx.isPending()).toBeFalsy();
        expect(tx.isConfirmed()).toBeTruthy();
        return txObj;
      });

      mockAxios.mockResponse({
        data: {
          result: {
            ID: 'some_hash',
            receipt: {
              success: true,
              cumulative_gas: 1000,
            },
          },
        },
      });
    });
  });
});
