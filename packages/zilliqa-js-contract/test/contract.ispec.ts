import BN from 'bn.js';
import {HTTPProvider} from 'zilliqa-js-core';
import {Account, Wallet} from 'zilliqa-js-account';
import {Contracts} from '../src/index';
import {abi} from './test.abi';
import {testContract} from './fixtures';

const accounts = [new Account(process.env.TEST_ACCOUNT as string)];
const provider = new HTTPProvider(process.env.HTTP_PROVIDER as string);
const contractFactory = new Contracts(provider, new Wallet(provider, accounts));

jest.setTimeout(90000);

describe('[Integration]: Contracts', () => {
  it('should be able to deploy a contract', async done => {
    const contract = contractFactory.new(abi, testContract, [
      {
        vname: 'contractOwner',
        type: 'ByStr20',
        value: '0xCC02A3C906612CC5BDB087A30E6093C9F0AA04FC',
      },
      {vname: 'name', type: 'String', value: 'NonFungibleToken'},
      {vname: 'symbol', type: 'String', value: 'NFT'},
    ]);

    const tx = await contract.deploy(new BN(1000), new BN(1000));
    tx.bimap(
      tx => {
        done();
        return tx;
      },
      err => {
        done();
      },
    );
  });
});
