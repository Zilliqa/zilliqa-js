import mockAxios from 'jest-mock-axios';
import {Transaction, Wallet} from 'zilliqa-js-account';
import * as zcrypto from 'zilliqa-js-crypto';
import {HTTPProvider} from 'zilliqa-js-core';
import BN from 'bn.js';

import Blockchain from '../chain';

describe('Module: Blockchain', () => {
  const provider = new HTTPProvider('https://mock.com');
  const wallet = new Wallet();
  for (let i = 0; i < 10; i++) {
    wallet.create();
  }
  const blockchain = new Blockchain(provider, wallet);

  it('should sign and send transactions', async () => {
    const tx = new Transaction({
      version: 1,
      nonce: 1,
      to: '0x1234567890123456789012345678901234567890',
      amount: new BN(0),
      gasPrice: 1000,
      gasLimit: 1000,
    });

    blockchain.createTransaction(tx);
    console.log(mockAxios.lastReqGet());
    // expect(tx.return().pubKey).toEqual(wallet.defaultAccount && wallet.defaultAccount.publicKey as string);
  });
});
