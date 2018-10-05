import BN from 'bn.js';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import {HTTPProvider} from 'zilliqa-js-core';
import {Wallet} from 'zilliqa-js-account';
import {ContractStatus, Contracts} from '../src/index';
import {abi} from './test.abi';
import {testContract} from './fixtures';

const mock = new MockAdapter(axios);
const provider = new HTTPProvider('https://mock.com');
const wallet = new Wallet(provider);

describe('Contracts', () => {
  afterEach(() => {
    mock.reset();
  });

  it('should be able to construct a fresh contract instance', async () => {
    const contractFactory = new Contracts(provider, wallet);
    const contract = contractFactory.new(abi, testContract, [
      {
        vname: 'contractOwner',
        type: 'ByStr20',
        value: '0x124567890124567890124567890124567890',
      },
      {vname: 'name', type: 'String', value: 'NonFungibleToken'},
      {vname: 'symbol', type: 'String', value: 'NFT'},
    ]);

    mock
      .onPost()
      .reply(200, {
        result: {TranID: 'some_hash'},
      })
      .onPost()
      .reply(200, {
        result: {
          ID: 'some_hash',
          receipt: {
            success: true,
            cumulative_gas: 1000,
          },
        },
      });

    const deployTx = await contract.deploy(new BN(1000), new BN(1000));
    deployTx.bimap(tx => {
      expect(contract.status).toEqual(ContractStatus.Deployed);
      return tx;
    });
  });
});
