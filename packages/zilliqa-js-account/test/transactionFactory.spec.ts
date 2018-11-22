import { HTTPProvider } from '@zilliqa-js/core';
import { BN, Long } from '@zilliqa-js/util';

import { Transaction } from '../src/transaction';
import { TransactionFactory } from '../src/transactionFactory';
import { Wallet } from '../src/wallet';

const provider = new HTTPProvider('https://mock.com');
const wallet = new Wallet(provider);
const transactionFactory = new TransactionFactory(provider, wallet);

describe('TransactionFactory', () => {
  it('should be able to create a fresh tx', () => {
    const tx = transactionFactory.new({
      version: 0,
      amount: new BN(0),
      gasPrice: new BN(1),
      gasLimit: Long.fromNumber(100),
      toAddr: '0x88888888888888888888',
    });

    expect(tx).toBeInstanceOf(Transaction);
    expect(tx.isInitialised()).toBeTruthy();
  });
});
