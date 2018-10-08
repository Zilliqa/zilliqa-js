import BN from 'bn.js';
import {HTTPProvider} from 'zilliqa-js-core';
import {Account, Transaction, Wallet} from 'zilliqa-js-account';
import Blockchain from '../src/chain';

jest.setTimeout(90000);

const accounts = [new Account(process.env.TEST_ACCOUNT as string)];
const provider = new HTTPProvider(process.env.HTTP_PROVIDER as string);
const bc = new Blockchain(provider, new Wallet(provider, accounts));
Transaction.setProvider(provider);

describe('[Integration]: Blockchain', () => {
  it('should be able to get the latest DS block', async () => {
    const response = await bc.getLatestDSBlock();
  });

  it('should be able to send a transaction', async () => {
    const transaction = new Transaction({
      version: 0,
      to: '8254b2c9acdf181d5d6796d63320fbb20d4edd12',
      amount: new BN(1000),
      gasPrice: 1000,
      gasLimit: 1000,
    });

    const {receipt} = await bc.createTransaction(transaction);

    expect(receipt && receipt.success).toBeTruthy;
  });
});
