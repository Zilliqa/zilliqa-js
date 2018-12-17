import { Account, Wallet } from '@zilliqa-js/account';
import { HTTPProvider } from '@zilliqa-js/core';
import { BN, Long } from '@zilliqa-js/util';

import { Contracts, ContractStatus } from '../src/index';
import { abi } from './test.abi';
import { testContract } from './fixtures';

const accounts = [new Account(process.env.GENESIS_PRIV_KEY as string)];
const provider = new HTTPProvider(process.env.HTTP_PROVIDER as string);
const contractFactory = new Contracts(provider, new Wallet(provider, accounts));

jest.setTimeout(180000);

describe('Contract - hello world', () => {
  let address: string;

  it('should be able to deploy the contract', async () => {
    let [tx, contract] = await contractFactory
      .new(
        testContract,
        [
          {
            vname: 'owner',
            type: 'ByStr20',
            value: `0x${process.env.GENESIS_ADDRESS}`,
          },
          {
            vname: '_scilla_version',
            type: 'Uint32',
            value: '0',
          },
        ],
        abi,
      )
      .deploy({
        gasPrice: new BN(100),
        gasLimit: Long.fromNumber(2500),
      });

    address = <string>contract.address;

    expect(tx.isConfirmed()).toBeTruthy();
    expect(contract.status).toEqual(ContractStatus.Deployed);
  });

  it('should be able to call setHello', async () => {
    const contract = contractFactory.at(address);
    // now let's transfer some tokens
    const call = await contract.call(
      'setHello',
      [
        {
          vname: 'msg',
          type: 'String',
          value: 'Hello World',
        },
      ],
      {
        amount: new BN(0),
        gasPrice: new BN(100),
        gasLimit: Long.fromNumber(2500),
      },
    );

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
    const contract = contractFactory.at('0123456789'.repeat(4));
    const call = await contract.call(
      'setHello',
      [
        {
          vname: 'msg',
          type: 'String',
          value: 'Hello World',
        },
      ],
      {
        amount: new BN(0),
        gasPrice: new BN(1000),
        gasLimit: Long.fromNumber(1000),
      },
    );

    expect(call.isRejected()).toBeTruthy();
  });
});
