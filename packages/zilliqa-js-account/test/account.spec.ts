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
import * as zcrypto from '@zilliqa-js/crypto';
import { BN, Long } from '@zilliqa-js/util';
const { Signature } = zcrypto;
import { Account } from '../src/account';
import { Transaction } from '../src/transaction';

describe('Account', () => {
  it('should be able to encode itself as a keystore file', async () => {
    const privateKey = zcrypto.schnorr.generatePrivateKey();
    const account = new Account(privateKey);
    const keystore = await account.toFile('stronk_password');

    const decrypted = await Account.fromFile(keystore, 'stronk_password');
    expect(decrypted.address).toEqual(account.address);
    expect(decrypted.privateKey).toEqual(account.privateKey);
  });

  it('should fail if given the wrong passphrase', async () => {
    const privateKey = zcrypto.schnorr.generatePrivateKey();
    const account = new Account(privateKey);
    const keystore = await account.toFile('stronk_password');

    try {
      await Account.fromFile(keystore, 'weak_password');
    } catch (error) {
      if (error instanceof Error) {
        expect(error.message).toEqual('Could not decrypt keystore file.');
      }
    }
  });

  it('should create accounts from keystores', async () => {
    const keystoreFixtures = [
      {
        privateKey:
          '50af9e8c08011953f568d1818ad500a84b906117fb79502fc069525d1475d543',
        passphrase: 'strong_password',
        keystore:
          '{"address":"0x3591c6b333776a5b6c885Ada53b4462dEe8c67B6","crypto":{"cipher":"aes-128-ctr","cipherparams":{"iv":"1b23d4a09fa241b9cbe176fbc7d9567f"},"ciphertext":"40cce0a0b4eee4e4258341e18d880ff4b12ed25887252b90b7de4b6be86da5d5","kdf":"scrypt","kdfparams":{"salt":"4997f389a370424072967f6faeb709c238ff3cc3606a4101fc3dcbdd74b67108","n":8192,"c":262144,"r":8,"p":1,"dklen":32},"mac":"97f0677a9f0ad0c6052896e1b5ae94f86025047b9fe2617c1fce220af0db0e82"},"id":"39626239-3338-4138-b662-363663333030","version":3}',
      },
      {
        privateKey:
          '629fd0230abafb7bc8d575c604e6a1b3fabb2c995d5d6d0ab504156ce22d7136',
        passphrase: 'strong_password',
        keystore:
          '{"address":"0x8d991C6222F26B9aB960dbD28A1e9f29ED77272d","crypto":{"cipher":"aes-128-ctr","cipherparams":{"iv":"6177b7d2561056e9be3c991cce5148ce"},"ciphertext":"562c10f06d4fd050edcc4f99ef3390da34174c9d5a22ca46f4ed7d8ff0131e34","kdf":"scrypt","kdfparams":{"salt":"6c35d2b1918ff020bb52b4374105d9c5f9c20e586f2b4067818fe55ccc21372f","n":8192,"c":262144,"r":8,"p":1,"dklen":32},"mac":"b19578d520eac69a989e196fa65b059be8dd5644e157d065a17379f85d2a2994"},"id":"66373132-6463-4634-b936-356330326230","version":3}',
      },
      {
        privateKey:
          'c6525c60b970082edf830ea2ebdbe2437bdf715e0bf7e3fbb8d4b0e73ec029bc',
        passphrase: 'strong_password',
        keystore:
          '{"address":"0xF5D26831Be0B1fe5a6Ba5286DC59FaacE63f24aD","crypto":{"cipher":"aes-128-ctr","cipherparams":{"iv":"44d6acb359150e9019e1dda58da2ceca"},"ciphertext":"3e37afff8624b000591dd84745738c64c2728b94a74da60d8600fa9419381694","kdf":"scrypt","kdfparams":{"salt":"bbf3723986c6ce90f8fe7846d2bc0bef40885688bef01733158652019f7f6c22","n":8192,"c":262144,"r":8,"p":1,"dklen":32},"mac":"6d8f5522a520dba0e6820715a4ae62dbc6412ae6d25aa3d2eacd8941f7c427a9"},"id":"35313363-3863-4265-b135-366531343061","version":3}',
      },
    ];

    for (const keystoreFixture of keystoreFixtures) {
      const { privateKey, passphrase, keystore } = keystoreFixture;
      const account = await Account.fromFile(keystore, passphrase);
      expect(account.privateKey).toEqual(privateKey);
    }
  });

  it('should be able to sign a transaction', () => {
    const privateKey = zcrypto.schnorr.generatePrivateKey();
    const account = new Account(privateKey);

    const rawTx = {
      version: 1,
      nonce: 1,
      toAddr: '0x1234567890123456789012345678901234567890',
      amount: new BN(888),
      pubKey: account.publicKey,
      gasPrice: new BN(888),
      gasLimit: new Long(888888),
      code: '',
      data: 'some_data',
    };

    const tx = new Transaction(
      rawTx,
      new HTTPProvider('https://mock-provider.com'),
    );
    const rawSignature = account.signTransaction(tx.bytes);

    const lgtm = zcrypto.schnorr.verify(
      tx.bytes,
      new Signature({
        r: new BN(rawSignature.slice(0, 64), 16),
        s: new BN(rawSignature.slice(64), 16),
      }),
      Buffer.from(account.publicKey, 'hex'),
    );

    expect(lgtm).toBeTruthy();
  });
});
