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
    const txb16 = transactionFactory.new({
      version: 0,
      amount: new BN(0),
      gasPrice: new BN(1),
      gasLimit: Long.fromNumber(100),
      toAddr: '0x4BAF5faDA8e5Db92C3d3242618c5B47133AE003C',
    });

    const txb32 = transactionFactory.new({
      version: 0,
      amount: new BN(0),
      gasPrice: new BN(1),
      gasLimit: Long.fromNumber(100),
      toAddr: '0x4BAF5faDA8e5Db92C3d3242618c5B47133AE003C',
    });

    expect(txb16).toBeInstanceOf(Transaction);
    expect(txb32).toBeInstanceOf(Transaction);

    expect(txb16.isInitialised()).toBeTruthy();
    expect(txb32.isInitialised()).toBeTruthy();
  });

  it('should throw if toAddr is an invalid checksum address', () => {
    const createTx = () => {
      return transactionFactory.new({
        version: 0,
        amount: new BN(0),
        gasPrice: new BN(1),
        gasLimit: Long.fromNumber(100),
        toAddr: '0x4bAf5fada8E5dB92C3D3242618C5b47133ae003c',
      });
    };

    expect(createTx).toThrowError();
  });

  it('should throw if toAddr is an invalid bech32 address', () => {
    const createTx = () => {
      return transactionFactory.new({
        version: 0,
        amount: new BN(0),
        gasPrice: new BN(1),
        gasLimit: Long.fromNumber(100),
        toAddr:
          'an84characterslonghumanreadablepartthatcontainsthenumber1andtheexcludedcharactersbio1569pvx',
      });
    };

    expect(createTx).toThrowError();
  });
});
