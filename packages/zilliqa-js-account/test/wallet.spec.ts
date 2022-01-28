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
import { getPubKeyFromPrivateKey, schnorr } from '@zilliqa-js/crypto';
import { BN, Long } from '@zilliqa-js/util';

import fetch, { MockParams } from 'jest-fetch-mock';

import { createWallet } from './util';
import { Account } from '../src/account';
import { Wallet } from '../src/wallet';
import { Transaction } from '../src/transaction';

const provider = new HTTPProvider('https://mock.com');

describe('Wallet', () => {
  afterEach(() => {
    fetch.resetMocks();
  });

  it('should be able to bootstrap with an array of Accounts ', () => {
    const accounts: Account[] = [];
    for (let i = 0; i < 10; i++) {
      accounts.push(new Account(schnorr.generatePrivateKey()));
    }

    const wallet = new Wallet(provider, accounts);
    expect(Object.keys(wallet.accounts).length).toEqual(10);
  });

  it('should be able to bootstrap from a mnemonic', async () => {
    const mnemonic =
      'cart hat drip lava jelly keep device journey bean mango rocket festival';
    const wallet = new Wallet(provider);
    const addresses = [];
    for (let i = 0; i < 10; i++) {
      const address = await wallet.addByMnemonic(mnemonic, i);
      addresses.push(address);
    }
    expect(Object.keys(wallet.accounts).length).toEqual(10);
    expect(Object.keys(wallet.accounts).sort()).toEqual(addresses.sort());
    expect(Object.keys(wallet.accounts).sort()).toEqual([
      '0x0237F40D30d3c37C9b77577ACbB11C972Cc58664',
      '0x0723DD96243491eE84A925eDB657f24582AEc899',
      '0x4878d8EB9A63493A6de066eB1458CaB672Dc8CfD',
      '0x68275607E8bDf7cFA248b5f5a07B576F9Ef39cD1',
      '0x852F52532c3c928269bdd3B83Ac88E25A04D6B3b',
      '0x9165AE9ceeb155fB75D9C1fee2041f12C6e1f5eA',
      '0xAACDF9c84Bba51878C8681C72f035B62135d6d7e',
      '0xCd6cb5bC8F3EE8fF7a91B060Ce341FEb6Fc40E21',
      '0xEcD9D875C7366432a7Ce403A7702dFa3e7F09602',
      '0xbEA456Fb58094Be1C7f99BB6D1584DCEc642B0B0',
    ]);
  });

  it('should be able to export a json keystore', async () => {
    const [walletA, [address]] = createWallet(1);
    const keystore = await walletA.export(address, 'stronk');
    const [walletB] = createWallet(0);
    const importedAddress = await walletB.addByKeystore(keystore, 'stronk');

    expect(importedAddress).toEqual(address);
  });

  it('should sign transactions with the default account', async () => {
    const [wallet] = createWallet(1);
    const pubKey = (wallet.defaultAccount &&
      wallet.defaultAccount.publicKey) as string;

    const tx = new Transaction(
      {
        version: 1,
        toAddr: '0x1234567890123456789012345678901234567890',
        amount: new BN(0),
        gasPrice: new BN(1000),
        gasLimit: Long.fromNumber(1000),
        pubKey,
      },
      provider,
    );

    fetch.once(
      JSON.stringify({
        id: 1,
        jsonrpc: '2.0',
        result: {
          balance: '39999999000000000',
          nonce: 1,
        },
      }),
    );

    const signed = await wallet.sign(tx);
    const signature = schnorr.toSignature(signed.txParams.signature as string);
    const lgtm = schnorr.verify(
      signed.bytes,
      signature,
      Buffer.from(pubKey, 'hex'),
    );

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(lgtm).toBeTruthy();
  });

  it('should throw funds not sufficient error', async () => {
    const [wallet] = createWallet(1);
    const pubKey = (wallet.defaultAccount &&
      wallet.defaultAccount.publicKey) as string;

    const tx = new Transaction(
      {
        version: 1,
        toAddr: '0x1234567890123456789012345678901234567890',
        amount: new BN(0),
        gasPrice: new BN(1000),
        gasLimit: Long.fromNumber(1000),
        pubKey,
      },
      provider,
    );

    fetch.once(
      JSON.stringify({
        id: 1,
        jsonrpc: '2.0',
        result: {
          balance: '100',
          nonce: 1,
        },
      }),
    );
    await expect(wallet.sign(tx)).rejects.toThrow();
  });

  it('should respect the supplied nonce, if any', async () => {
    const [wallet] = createWallet(1);
    const pubKey = (wallet.defaultAccount &&
      wallet.defaultAccount.publicKey) as string;

    const tx = new Transaction(
      {
        version: 0,
        nonce: 888,
        toAddr: '0x1234567890123456789012345678901234567890',
        amount: new BN(888),
        gasPrice: new BN(888),
        gasLimit: Long.fromNumber(888),
        pubKey,
      },
      provider,
    );

    fetch.once(
      JSON.stringify({
        id: 1,
        jsonrpc: '2.0',
        result: {
          balance: '39999999000000000',
          nonce: 1,
        },
      }),
    );

    const signed = await wallet.sign(tx);
    const signature = schnorr.toSignature(signed.txParams.signature as string);
    const lgtm = schnorr.verify(
      signed.bytes,
      signature,
      Buffer.from(pubKey, 'hex'),
    );

    expect(lgtm).toBeTruthy();
  });

  it('should throw an error if asked to sign with no accounts available', () => {
    const pubKey = getPubKeyFromPrivateKey(schnorr.generatePrivateKey());
    const [wallet] = createWallet(0);

    const tx = new Transaction(
      {
        version: 1,
        nonce: 1,
        toAddr: '0x1234567890123456789012345678901234567890',
        amount: new BN(0),
        gasPrice: new BN(1000),
        gasLimit: Long.fromNumber(1000),
        pubKey,
      },
      provider,
    );

    expect(() => wallet.sign(tx)).toThrow();
  });

  it('should sign batch transactions with default account', async () => {
    const [wallet] = createWallet(1);
    const pubKey = (wallet.defaultAccount &&
      wallet.defaultAccount.publicKey) as string;

    const txList = [];
    for (let i = 0; i < 2; i++) {
      const tx = new Transaction(
        {
          version: 1,
          toAddr: '0x1234567890123456789012345678901234567890',
          amount: new BN(0),
          gasPrice: new BN(1000),
          gasLimit: Long.fromNumber(1000),
          pubKey,
        },
        provider,
      );
      txList.push(tx);
    }

    // first balance is for get balance before looping txlist
    // the other two balance is when it calls signWith
    // the last is for return value
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
          balance: '39999999000000000',
          nonce: 1,
        },
      },
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
          ID: 'some_hash',
          receipt: { success: true },
        },
      },
    ].map(
      (res) => [JSON.stringify(res), { status: 200 }] as [string, MockParams],
    );

    fetch.mockResponses(...responses);

    const batchResult = await wallet.signBatch(txList);

    for (const signedTx of batchResult) {
      const signature = schnorr.toSignature(
        signedTx.txParams.signature as string,
      );
      const lgtm = schnorr.verify(
        signedTx.bytes,
        signature,
        Buffer.from(pubKey, 'hex'),
      );
      expect(lgtm).toBeTruthy();
    }
  });

  it('should throw an error for sign batch with no default account', async () => {
    const pubKey = getPubKeyFromPrivateKey(schnorr.generatePrivateKey());
    const [wallet] = createWallet(0);

    const txList: Transaction[] = [];
    for (let i = 0; i < 2; i++) {
      const tx = new Transaction(
        {
          version: 1,
          toAddr: '0x1234567890123456789012345678901234567890',
          amount: new BN(0),
          gasPrice: new BN(1000),
          gasLimit: Long.fromNumber(1000),
          pubKey,
        },
        provider,
      );
      txList.push(tx);
    }

    await expect(wallet.signBatch(txList)).rejects.toThrow(
      'This wallet has no default account.',
    );
  });

  it('should throw an error if offline sign is true and txn does not have explicit nonce', async () => {
    const [wallet] = createWallet(1);
    const pubKey = (wallet.defaultAccount &&
      wallet.defaultAccount.publicKey) as string;

    const tx = new Transaction(
      {
        version: 0,
        toAddr: '0x1234567890123456789012345678901234567890',
        amount: new BN(888),
        gasPrice: new BN(888),
        gasLimit: Long.fromNumber(888),
        pubKey,
      },
      provider,
    );

    await expect(wallet.sign(tx, true)).rejects.toThrow();
  });

  it('should not have error if offline sign is true and txn HAS explicit nonce', async () => {
    const [wallet] = createWallet(1);
    const pubKey = (wallet.defaultAccount &&
      wallet.defaultAccount.publicKey) as string;

    const tx = new Transaction(
      {
        version: 1,
        toAddr: '0x1234567890123456789012345678901234567890',
        nonce: 1,
        amount: new BN(0),
        gasPrice: new BN(1000),
        gasLimit: Long.fromNumber(1000),
        pubKey,
      },
      provider,
    );

    const signed = await wallet.sign(tx, true);
    const signature = schnorr.toSignature(signed.txParams.signature as string);
    const lgtm = schnorr.verify(
      signed.bytes,
      signature,
      Buffer.from(pubKey, 'hex'),
    );

    expect(lgtm).toBeTruthy();
  });

  it('should not have error if offline sign is explicit false and no explicit nonce', async () => {
    const [wallet] = createWallet(1);
    const pubKey = (wallet.defaultAccount &&
      wallet.defaultAccount.publicKey) as string;

    const tx = new Transaction(
      {
        version: 1,
        toAddr: '0x1234567890123456789012345678901234567890',
        amount: new BN(0),
        gasPrice: new BN(1000),
        gasLimit: Long.fromNumber(1000),
        pubKey,
      },
      provider,
    );

    fetch.once(
      JSON.stringify({
        id: 1,
        jsonrpc: '2.0',
        result: {
          balance: '39999999000000000',
          nonce: 1,
        },
      }),
    );

    const signed = await wallet.sign(tx, false); // explicit FALSE
    const signature = schnorr.toSignature(signed.txParams.signature as string);
    const lgtm = schnorr.verify(
      signed.bytes,
      signature,
      Buffer.from(pubKey, 'hex'),
    );

    expect(lgtm).toBeTruthy();
  });

  it('should not have error if offline sign is explicit false and txn HAS explicit nonce', async () => {
    const [wallet] = createWallet(1);
    const pubKey = (wallet.defaultAccount &&
      wallet.defaultAccount.publicKey) as string;

    const tx = new Transaction(
      {
        version: 1,
        toAddr: '0x1234567890123456789012345678901234567890',
        nonce: 1,
        amount: new BN(0),
        gasPrice: new BN(1000),
        gasLimit: Long.fromNumber(1000),
        pubKey,
      },
      provider,
    );

    const signed = await wallet.sign(tx, false); // explicit FALSE
    const signature = schnorr.toSignature(signed.txParams.signature as string);
    const lgtm = schnorr.verify(
      signed.bytes,
      signature,
      Buffer.from(pubKey, 'hex'),
    );

    expect(lgtm).toBeTruthy();
  });
});
