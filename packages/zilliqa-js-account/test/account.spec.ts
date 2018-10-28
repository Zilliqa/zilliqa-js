import fs from 'fs';
import BN from 'bn.js';
import Signature from 'elliptic/lib/elliptic/ec/signature';
import { HTTPProvider } from '@zilliqa/zilliqa-js-core';
import * as zcrypto from '@zilliqa/zilliqa-js-crypto';
import Account from '../src/account';
import Transaction from '../src/transaction';

describe('Account', () => {
  it('should be able to encode itself as a keystore file', async () => {
    const privateKey = zcrypto.generatePrivateKey();
    const account = new Account(privateKey);
    const keystore = await account.toFile('stronk_password');

    const decrypted = await Account.fromFile(keystore, 'stronk_password');
    expect(decrypted.privateKey).toEqual(account.privateKey);
  });

  it('should fail if given the wrong passphrase', async () => {
    const privateKey = zcrypto.generatePrivateKey();
    const account = new Account(privateKey);
    const keystore = await account.toFile('stronk_password');

    try {
      const decrypted = await Account.fromFile(keystore, 'weak_password');
    } catch (err) {
      expect(err.message).toEqual('Could not decrypt keystore file.');
    }
  });

  it('should create accounts from keystores', async () => {
    const content = await new Promise((resolve, reject) => {
      fs.readFile(
        `${__dirname}/fixtures/keystores.json`,
        'utf8',
        (err, data) => {
          err ? reject(err) : resolve(data);
        },
      );
    });
    const keystoreFixtures = JSON.parse(content as string);
    for (const keystoreFixture of keystoreFixtures) {
      const { privateKey, passphrase, keystore } = keystoreFixture;
      const account = await Account.fromFile(
        JSON.stringify(keystore),
        passphrase,
      );
      expect('0x' + account.privateKey).toEqual(privateKey);
    }
  });

  it('should be able to sign a transaction', () => {
    const privateKey = zcrypto.generatePrivateKey();
    const account = new Account(privateKey);

    const rawTx = {
      version: 1,
      nonce: 1,
      toAddr: 'another_person',
      amount: new BN(888),
      pubKey: account.publicKey,
      gasPrice: new BN(888),
      gasLimit: new BN(888888),
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
