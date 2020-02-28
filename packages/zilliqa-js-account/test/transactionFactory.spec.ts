import { HTTPProvider } from '@zilliqa-js/core';
import { BN, Long } from '@zilliqa-js/util';

import { Transaction } from '../src/transaction';
import { TransactionFactory } from '../src/transactionFactory';
import { Wallet } from '../src/wallet';
// tslint:disable-next-line: no-implicit-dependencies
import fetch from 'jest-fetch-mock';

const provider = new HTTPProvider('https://mock.com');
const wallet = new Wallet(provider);
wallet.addByPrivateKey(
  '3375F915F3F9AE35E6B301B7670F53AD1A5BE15D8221EC7FD5E503F21D3450C8',
);
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

  it('should throw if toAddr is an invalid address', () => {
    const createTx = () => {
      return transactionFactory.new({
        version: 0,
        amount: new BN(0),
        gasPrice: new BN(1),
        gasLimit: Long.fromNumber(100),
        toAddr: '0x4bAf5fada8E5dB92C3D3242618C5b47133ae00c',
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

  it('should new payment transaction', async () => {
    const responses = [
      {
        id: 1,
        jsonrpc: '2.0',
        result: {
          balance: 888,
          nonce: 1,
        },
      },
    ].map((res) => [JSON.stringify(res)] as [string]);

    fetch.mockResponses(...responses);

    await expect(
      transactionFactory.payment({
        version: 0,
        toAddr: '0xA54E49719267E8312510D7b78598ceF16ff127CE',
        amount: new BN(100),
        gasPrice: new BN(1),
        gasLimit: Long.fromNumber(1),
      }),
    ).resolves;
  });

  it('should report no sufficient fund', async () => {
    const responses = [
      {
        id: 1,
        jsonrpc: '2.0',
        result: {
          balance: 888,
          nonce: 1,
        },
      },
    ].map((res) => [JSON.stringify(res)] as [string]);

    fetch.mockResponses(...responses);

    await expect(
      transactionFactory.payment({
        version: 0,
        toAddr: '0xA54E49719267E8312510D7b78598ceF16ff127CE',
        amount: new BN(900),
        gasPrice: new BN(1),
        gasLimit: Long.fromNumber(1),
      }),
    ).rejects.toThrow('No sufficient fund');
  });
});
