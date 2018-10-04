import mockAxios from 'jest-mock-axios';
import {Transaction, Wallet} from 'zilliqa-js-account';
import * as zcrypto from 'zilliqa-js-crypto';
import {HTTPProvider} from 'zilliqa-js-core';
import BN from 'bn.js';

import Blockchain from '../chain';

describe('Module: Blockchain', () => {
  const provider = new HTTPProvider('https://mock.com');
  const wallet = new Wallet(provider);
  for (let i = 0; i < 10; i++) {
    wallet.create();
  }

  const blockchain = new Blockchain(provider, wallet);

  afterEach(() => {
    mockAxios.reset();
  });

  it('should sign and send transactions', () => {
    const tx = new Transaction({
      version: 1,
      nonce: 1,
      to: '0x1234567890123456789012345678901234567890',
      amount: new BN(0),
      gasPrice: 1000,
      gasLimit: 1000,
    });

    blockchain.createTransaction(tx).then(() => {
      const req = mockAxios.lastReqGet().data;
      expect(req.params[0]).toHaveProperty('signature');
      expect(req.params[0]).toHaveProperty('pubKey');
    });
  });
});
