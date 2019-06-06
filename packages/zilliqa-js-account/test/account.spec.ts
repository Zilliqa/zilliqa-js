import Signature from 'elliptic/lib/elliptic/ec/signature';
import { HTTPProvider } from '@zilliqa-js/core';
import * as zcrypto from '@zilliqa-js/crypto';
import { BN, Long } from '@zilliqa-js/util';

import { Account } from '../src/account';
import { Transaction } from '../src/transaction';

describe('Account', () => {
  it('should be able to sign a transaction', async () => {
    const account = new Account();
    await account.create();

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
    const rawSignature = await account.signTransaction(tx.bytes);

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
