import BN from 'bn.js';
import { HTTPProvider } from '@zilliqa/zilliqa-js-core';
import { Account, Transaction, Wallet } from '@zilliqa/zilliqa-js-account';

import Blockchain from '../src/chain';
import { DsBlockObj } from '../src/types';
import schemas from './schema.json';

jest.setTimeout(90000);

const accounts = [new Account(process.env.GENESIS_PRIV_KEY as string)];
const provider = new HTTPProvider(process.env.HTTP_PROVIDER as string);
const bc = new Blockchain(provider, new Wallet(provider, accounts));

describe('[Integration]: Blockchain', () => {
  it('should be able to get blockchain info', async () => {
    const response = await bc.getBlockChainInfo();
    expect(response.result).toMatchSchema(schemas.definitions.BlockchainInfo);
  });

  it('should be able to get a given DS block', async () => {
    const response = await bc.getDSBlock(1);
    expect(response.result).toMatchSchema(schemas.definitions.DsBlockObj);
  });

  it('should be able to get the latest DS block', async () => {
    const response = await bc.getLatestDSBlock();
    expect(response.result).toMatchSchema(schemas.definitions.DsBlockObj);
  });

  it('should be able to get a list of DS blocks', async () => {
    const response = await bc.getLatestDSBlock();
    const latestBlock = (<DsBlockObj>response.result).header.blockNum;
    const responseDsList = await bc.getDsBlockListing(1);

    expect(responseDsList.result).toMatchSchema(schemas.definitions.BlockList);
  });

  it('should be able to send a transaction', async () => {
    const transaction = new Transaction(
      {
        version: 0,
        toAddr: 'd11238e5fcd70c817c22922c500830d00bc1e778',
        amount: new BN(1000),
        gasPrice: new BN(1000),
        gasLimit: new BN(1000),
      },
      provider,
    );

    const {
      txParams: { receipt },
    } = await bc.createTransaction(transaction);

    expect(receipt && receipt.success).toBeTruthy();
  });
});
