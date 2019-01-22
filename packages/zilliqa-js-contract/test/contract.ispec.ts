import { Account, Transaction, Wallet } from '@zilliqa-js/account';
import { Blockchain } from '@zilliqa-js/blockchain';
import { HTTPProvider } from '@zilliqa-js/core';
import { BN, Long, bytes, units } from '@zilliqa-js/util';

import { Contracts, Contract, ContractStatus } from '../src/index';
import { testContract, zrc20, simpleDEX as dex } from './fixtures';

// testnet chain_id is always 2
const CHAIN_ID = 2;
const MSG_VERSION = 1;
const VERSION = bytes.pack(CHAIN_ID, MSG_VERSION);
const MIN_GAS_PRICE = new BN(1000000000);
const MIN_GAS_LIMIT = Long.fromNumber(1);

const provider = new HTTPProvider(process.env.HTTP_PROVIDER as string);
const accounts = [new Account(process.env.GENESIS_PRIV_KEY as string)];
const wallet = new Wallet(provider, accounts);
const blockchain = new Blockchain(provider, wallet);
const contractFactory = new Contracts(provider, wallet);

jest.setTimeout(720000);

describe('Contract: hello world', () => {
  let address: string;

  it('should be able to deploy the contract', async () => {
    let [tx, contract] = await contractFactory
      .new(testContract, [
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
      ])
      .deploy({
        version: VERSION,
        gasPrice: new BN(1000000000),
        gasLimit: Long.fromNumber(5000),
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
        version: VERSION,
        amount: new BN(0),
        gasPrice: new BN(1000000000),
        gasLimit: Long.fromNumber(5000),
      },
    );

    expect(call.txParams.receipt && call.txParams.receipt.success).toBeTruthy();

    const state = await contract.getState();

    console.log(state);

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
        version: VERSION,
        amount: new BN(0),
        gasPrice: new BN(1000000000),
        gasLimit: Long.fromNumber(1000),
      },
    );

    expect(call.isRejected()).toBeTruthy();
  });
});

describe('Contract: Simple DEX', () => {
  // accounts
  let banker: Account = wallet.accounts[process.env.GENESIS_ADDRESS as string];
  let simpleDexOwner: Account;
  let token1Owner: Account;
  let token2Owner: Account;
  let token1Holder: Account;
  let token2Holder: Account;

  // contracts
  let token1: Contract;
  let token2: Contract;
  let simpleDEX: Contract;

  let cumulativeGasTotal = 0;

  it('distributes tokens first', async () => {
    const mnemonic = process.env.MNEMONIC as string;
    const actors: Account[] = [];

    for (let i = 0; i < 5; i++) {
      const address = wallet.addByMnemonic(mnemonic, i);
      actors.push(wallet.accounts[address]);
    }

    // set up 5 accounts: simple-dex owner, token1 owner, token2 owner, token1 holder, token2 holder
    [
      simpleDexOwner,
      token1Owner,
      token2Owner,
      token1Holder,
      token2Holder,
    ] = actors;

    const balance = await blockchain.getBalance(banker.address);

    if (balance.error) {
      throw new Error(balance.error.message);
    }

    // distribute tokens to all 5 accounts
    return await Promise.all(
      actors.map((actor, i) => {
        const tx = new Transaction(
          {
            version: VERSION,
            nonce: balance.result.nonce + i + 1,
            pubKey: banker.publicKey,
            toAddr: actor.address,
            amount: units.toQa(1000000, units.Units.Zil),
            gasPrice: MIN_GAS_PRICE,
            gasLimit: MIN_GAS_LIMIT,
          },
          provider,
        );

        return blockchain.createTransaction(tx, 33, 1500);
      }),
    );

    console.log('Distributed tokens.');
  });

  // deploy our contracts;
  it('deploys all the necessary contracts', async () => {
    let res = await Promise.all([
      contractFactory
        .new(zrc20, [
          { vname: '_scilla_version', type: 'Uint32', value: '0' },
          {
            vname: 'owner',
            type: 'ByStr20',
            value: `0x${token1Owner.address}`,
          },
          { vname: 'total_tokens', type: 'Uint128', value: '888888888888888' },
        ])
        .deploy({
          version: VERSION,
          pubKey: token1Owner.publicKey,
          gasPrice: new BN(1000000000),
          gasLimit: Long.fromNumber(100000),
        }),
      contractFactory
        .new(zrc20, [
          { vname: '_scilla_version', type: 'Uint32', value: '0' },
          {
            vname: 'owner',
            type: 'ByStr20',
            value: `0x${token2Owner.address}`,
          },
          { vname: 'total_tokens', type: 'Uint128', value: '888888888888888' },
        ])
        .deploy({
          version: VERSION,
          pubKey: token2Owner.publicKey,
          gasPrice: new BN(1000000000),
          gasLimit: Long.fromNumber(100000),
        }),
      contractFactory
        .new(dex, [
          { vname: '_scilla_version', type: 'Uint32', value: '0' },
          {
            vname: 'contractOwner',
            type: 'ByStr20',
            value: `0x${simpleDexOwner.address}`,
          },
        ])
        .deploy({
          version: VERSION,
          pubKey: simpleDexOwner.publicKey,
          gasPrice: new BN(1000000000),
          gasLimit: Long.fromNumber(100000),
        }),
    ]);

    res.forEach(([tx, ct]) => {
      if (tx.txParams.receipt) {
        // @ts-ignore
        cumulativeGasTotal += parseInt(tx.txParams.receipt.cumulative_gas, 10);
      }

      expect(tx.isConfirmed()).toBe(true);
    });

    [[, token1], [, token2], [, simpleDEX]] = res;

    const updateContractAddress = await simpleDEX.call(
      'updateContractAddress',
      [
        {
          vname: 'address',
          type: 'ByStr20',
          value: `0x${simpleDEX.address}`,
        },
      ],
      {
        version: VERSION,
        pubKey: simpleDexOwner.publicKey,
        amount: new BN(0),
        gasPrice: new BN(1000000000),
        gasLimit: Long.fromNumber(5000),
      },
    );

    if (updateContractAddress.txParams.receipt) {
      cumulativeGasTotal += parseInt(
        // @ts-ignore
        updateContractAddress.txParams.receipt.cumulative_gas,
        10,
      );
    }

    expect(updateContractAddress.isConfirmed()).toBe(true);
  });

  // transfer tokens from owners to holders
  it('distributes tokens to hodlers', async () => {
    const [xfer1, xfer2] = await Promise.all([
      token1.call(
        'Transfer',
        [
          { vname: 'to', type: 'ByStr20', value: `0x${token1Holder.address}` },
          { vname: 'tokens', type: 'Uint128', value: '888' },
        ],
        {
          version: VERSION,
          pubKey: token1Owner.publicKey,
          amount: new BN(0),
          gasPrice: new BN(1000000000),
          gasLimit: Long.fromNumber(10000),
        },
      ),
      token2.call(
        'Transfer',
        [
          { vname: 'to', type: 'ByStr20', value: `0x${token2Holder.address}` },
          { vname: 'tokens', type: 'Uint128', value: '888' },
        ],
        {
          version: VERSION,
          pubKey: token2Owner.publicKey,
          amount: new BN(0),
          gasPrice: new BN(1000000000),
          gasLimit: Long.fromNumber(10000),
        },
      ),
    ]);

    if (xfer1.txParams.receipt) {
      // @ts-ignore
      cumulativeGasTotal += parseInt(xfer1.txParams.receipt.cumulative_gas, 10);
    }

    if (xfer2.txParams.receipt) {
      // @ts-ignore
      cumulativeGasTotal += parseInt(xfer2.txParams.receipt.cumulative_gas, 10);
    }

    expect(xfer1.isConfirmed()).toBe(true);
    expect(xfer2.isConfirmed()).toBe(true);

    // call approve
    const [approveA, approveB] = await Promise.all([
      token1.call(
        'Approve',
        [
          {
            vname: 'spender',
            type: 'ByStr20',
            value: `0x${simpleDEX.address}`,
          },
          {
            vname: 'tokens',
            type: 'Uint128',
            value: '168',
          },
        ],
        {
          version: VERSION,
          pubKey: token1Holder.publicKey,
          amount: new BN(0),
          gasPrice: new BN(1000000000),
          gasLimit: Long.fromNumber(5000),
        },
      ),
      token2.call(
        'Approve',
        [
          {
            vname: 'spender',
            type: 'ByStr20',
            value: `0x${simpleDEX.address}`,
          },
          {
            vname: 'tokens',
            type: 'Uint128',
            value: '168',
          },
        ],
        {
          version: VERSION,
          pubKey: token2Holder.publicKey,
          amount: new BN(0),
          gasPrice: new BN(1000000000),
          gasLimit: Long.fromNumber(10000),
        },
      ),
    ]);

    if (approveA.txParams.receipt) {
      cumulativeGasTotal += parseInt(
        // @ts-ignore
        approveA.txParams.receipt.cumulative_gas,
        10,
      );
    }

    if (approveB.txParams.receipt) {
      cumulativeGasTotal += parseInt(
        // @ts-ignore
        approveB.txParams.receipt.cumulative_gas,
        10,
      );
    }

    expect(approveA.isConfirmed()).toBe(true);
    expect(approveB.isConfirmed()).toBe(true);
  });

  it('can createOrder and fillOrder', async () => {
    // create an order
    const createOrder = await simpleDEX.call(
      'makeOrder',
      [
        {
          vname: 'tokenA',
          type: 'ByStr20',
          value: `0x${token1.address}`,
        },
        {
          vname: 'valueA',
          type: 'Uint128',
          value: '88',
        },
        {
          vname: 'tokenB',
          type: 'ByStr20',
          value: `0x${token2.address}`,
        },
        {
          vname: 'valueB',
          type: 'Uint128',
          value: '88',
        },
        {
          vname: 'expirationBlock',
          type: 'BNum',
          value: '500000000',
        },
      ],
      {
        version: VERSION,
        pubKey: token1Holder.publicKey,
        amount: new BN(0),
        gasPrice: new BN(1000000000),
        gasLimit: Long.fromNumber(100000),
      },
    );

    if (createOrder.txParams.receipt) {
      cumulativeGasTotal += parseInt(
        // @ts-ignore
        createOrder.txParams.receipt.cumulative_gas,
        10,
      );
    }

    expect(createOrder.isConfirmed()).toBe(true);

    // check states
    const state = await simpleDEX.getState();
    expect(state.length).toBeGreaterThan(0);
  });

  afterAll(() => {
    console.log('Total gas consumed: ', cumulativeGasTotal);
  });
});
