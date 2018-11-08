import BN from 'bn.js';
import { HTTPProvider } from '@zilliqa-js/core';
import { Account, Wallet } from '@zilliqa-js/account';
import { Contracts, Contract, ContractStatus } from '../src/index';
import { abi } from './test.abi';
import { testContract } from './fixtures';

const accounts = [new Account(process.env.GENESIS_PRIV_KEY as string)];
const provider = new HTTPProvider(process.env.HTTP_PROVIDER as string);
const contractFactory = new Contracts(provider, new Wallet(provider, accounts));

jest.setTimeout(180000);

describe('Contract - hello world', () => {
  let contract: Contract;

  it('should be able to deploy the contract', async () => {
    contract = await contractFactory
      .new(
        testContract,
        [
          {
            vname: 'owner',
            type: 'ByStr20',
            value: `0x${process.env.GENESIS_ADDRESS}`,
          },
        ],
        abi,
      )
      .deploy(new BN(1), new BN(5000));

    expect(contract.status).toEqual(ContractStatus.Deployed);
  });

  it('should be able to call setHello', async () => {
    // now let's transfer some tokens
    const call = await contract.call('setHello', [
      {
        vname: 'msg',
        type: 'String',
        value: 'Hello World',
      },
    ]);

    expect(call.txParams.receipt && call.txParams.receipt.success).toBeTruthy();

    const state = await contract.getState();

    expect(
      state.filter((v) => {
        return v.vname === 'welcome_msg';
      })[0].value,
    ).toEqual('Hello World');
  });

  it('should be rejected by the server if a non-existent contract is called', async () => {
    // setup a non-existent address
    const original = contract.address;
    contract.address = '0123456789'.repeat(4);
    const call = await contract.call('setHello', [
      {
        vname: 'msg',
        type: 'String',
        value: 'Hello World',
      },
    ]);

    contract.address = original;
    expect(call.isRejected()).toBeTruthy;
  });
});
