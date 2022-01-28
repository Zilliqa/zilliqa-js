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

import { HTTPProvider } from '@zilliqa-js/core';
import { BN, Long } from '@zilliqa-js/util';

import { Transaction } from '../src/transaction';
import { TransactionFactory } from '../src/transactionFactory';
import { Wallet } from '../src/wallet';
import fetch, { MockParams } from 'jest-fetch-mock';

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
    ].map(
      (res) => [JSON.stringify(res), { status: 200 }] as [string, MockParams],
    );

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
    ].map(
      (res) => [JSON.stringify(res), { status: 200 }] as [string, MockParams],
    );

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
