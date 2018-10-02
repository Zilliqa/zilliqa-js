import BN from 'bn.js';
import hashjs from 'hash.js';
import Signature from 'elliptic/lib/elliptic/ec/signature';
import * as zcrypto from 'zilliqa-js-crypto';
import Account from '../account';
import Transaction from '../transaction';

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

  it('should be able to sign a transaction', () => {
    const privateKey = zcrypto.generatePrivateKey();
    const account = new Account(privateKey);

    const rawTx = {
      version: 1,
      nonce: 1,
      to: 'another_person',
      amount: new BN(888),
      pubKey: account.publicKey,
      gasPrice: 888,
      gasLimit: 888888,
      code: '',
      data: 'some_data',
    };

    const tx = new Transaction(rawTx);
    const rawSignature = account.signTransaction(tx);

    const lgtm = zcrypto.schnorr.verify(
      Buffer.from(
        hashjs
          .sha256()
          .update(tx.bytes, 'hex')
          .digest('hex'),
        'hex',
      ),
      new Signature({
        r: new BN(rawSignature.slice(0, 64), 16),
        s: new BN(rawSignature.slice(64), 16),
      }),
      Buffer.from(account.publicKey, 'hex'),
    );

    expect(lgtm).toBeTruthy();
  });
});
