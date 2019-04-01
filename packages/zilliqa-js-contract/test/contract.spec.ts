import { Wallet } from '@zilliqa-js/account';
import { HTTPProvider } from '@zilliqa-js/core';
import { BN, Long, bytes } from '@zilliqa-js/util';

import fetch from 'jest-fetch-mock';

import { ContractStatus, Contracts } from '../src/index';
import { abi } from './test.abi';
import { testContract } from './fixtures';

const VERSION = bytes.pack(8, 8);
const provider = new HTTPProvider('https://mock.com');
const wallet = new Wallet(provider);
const contractFactory = new Contracts(provider, wallet);
wallet.create();

describe('Contracts', () => {
  afterEach(() => {
    fetch.resetMocks();
  });

  it('new contracts should have a stauts of initialised', () => {
    const contract = contractFactory.new(testContract, [
      {
        vname: 'contractOwner',
        type: 'ByStr20',
        value: '0x124567890124567890124567890124567890',
      },
      { vname: 'name', type: 'String', value: 'NonFungibleToken' },
      { vname: 'symbol', type: 'String', value: 'NFT' },
    ]);

    expect(contract.isInitialised()).toBeTruthy();
    expect(contract.status).toEqual(ContractStatus.Initialised);
  });

  it('should be able to deploy a contract', async () => {
    const contract = contractFactory.new(
      testContract,
      [
        {
          vname: 'contractOwner',
          type: 'ByStr20',
          value: '0x124567890124567890124567890124567890',
        },
        { vname: 'name', type: 'String', value: 'NonFungibleToken' },
        { vname: 'symbol', type: 'String', value: 'NFT' },
      ],
      abi,
    );

    const responses = [
      {
        id: 1,
        jsonrpc: '2.0',
        result: {
          balance: 888,
          nonce: 1,
        },
      },
      {
        id: 1,
        jsonrpc: '2.0',
        result: {
          TranID: 'some_hash',
          Info: 'Non-contract txn, sent to shard',
        },
      },
      {
        id: 1,
        jsonrpc: '2.0',
        result: {
          ID: 'some_hash',
          receipt: { success: true, cumulative_gas: '1000' },
        },
      },
    ].map((res) => [JSON.stringify(res)] as [string]);

    fetch.mockResponses(...responses);

    const [tx, deployed] = await contract.deploy({
      version: VERSION,
      gasPrice: new BN(1000),
      gasLimit: Long.fromNumber(1000),
    });

    expect(tx.isConfirmed()).toBeTruthy();
    expect(deployed.isDeployed()).toBeTruthy();
    expect(deployed.status).toEqual(ContractStatus.Deployed);
    expect(contract.address).toMatch(/[A-F0-9]+/);
  });

  it('should typecheck for ADTs', async () => {
    const contract = contractFactory.new(
      testContract,
      [
        {
          vname: 'contractOwner',
          type: 'ByStr20',
          value: '0x124567890124567890124567890124567890',
        },
        { vname: 'name', type: 'String', value: 'NonFungibleToken' },
        { vname: 'symbol', type: 'String', value: 'NFT' },
        {
          vname: 'dummy_optional_value',
          type: 'Option (Uint32)',
          value: { constructor: 'None', argtypes: ['Uint32'], arguments: [] },
        },
      ],
      abi,
    );

    const responses = [
      {
        id: 1,
        jsonrpc: '2.0',
        result: {
          balance: 888,
          nonce: 1,
        },
      },
      {
        id: 1,
        jsonrpc: '2.0',
        result: {
          TranID: 'some_hash',
          Info: 'Non-contract txn, sent to shard',
        },
      },
      {
        id: 1,
        jsonrpc: '2.0',
        result: {
          ID: 'some_hash',
          receipt: { success: true, cumulative_gas: '1000' },
        },
      },
    ].map((res) => [JSON.stringify(res)] as [string]);

    fetch.mockResponses(...responses);

    const [tx, deployed] = await contract.deploy({
      version: VERSION,
      gasPrice: new BN(1000),
      gasLimit: Long.fromNumber(1000),
    });

    expect(tx.isConfirmed()).toBeTruthy();
    expect(deployed.isDeployed()).toBeTruthy();
    expect(deployed.status).toEqual(ContractStatus.Deployed);
    expect(contract.address).toMatch(/[A-F0-9]+/);
  });

  it('should not swallow network errors', async () => {
    const contract = contractFactory.new(
      testContract,
      [
        {
          vname: 'contractOwner',
          type: 'ByStr20',
          value: '0x124567890124567890124567890124567890',
        },
        { vname: 'name', type: 'String', value: 'NonFungibleToken' },
        { vname: 'symbol', type: 'String', value: 'NFT' },
      ],
      abi,
    );

    const responses = [
      {
        id: 1,
        jsonrpc: '2.0',
        result: {
          balance: 888,
          nonce: 1,
        },
      },
      {
        id: 1,
        jsonrpc: '2.0',
        result: {
          TranID: 'some_hash',
          Info: 'Non-contract txn, sent to shard',
        },
      },
    ].map((res) => [JSON.stringify(res)] as [string]);

    fetch
      .mockResponses(...responses)
      .mockRejectOnce(new Error('something bad happened'));

    await expect(
      contract.deploy({
        version: VERSION,
        gasPrice: new BN(1000),
        gasLimit: Long.fromNumber(1000),
      }),
    ).rejects.toThrow();
  });

  it('if the underlying transaction is rejected, status should be rejected', async () => {
    const responses = [
      {
        id: 1,
        jsonrpc: '2.0',
        result: {
          balance: 888,
          nonce: 1,
        },
      },
      {
        id: 1,
        jsonrpc: '2.0',
        error: {
          code: 444,
          message: 'Mega fail',
        },
      },
    ].map((res) => [JSON.stringify(res)] as [string]);

    fetch.mockResponses(...responses);

    const [tx, contract] = await contractFactory
      .new(
        testContract,
        [
          {
            vname: 'contractOwner',
            type: 'ByStr20',
            value: '0x124567890124567890124567890124567890',
          },
          { vname: 'name', type: 'String', value: 'NonFungibleToken' },
          { vname: 'symbol', type: 'String', value: 'NFT' },
        ],
        abi,
      )
      .deploy({
        version: VERSION,
        gasPrice: new BN(1000),
        gasLimit: Long.fromNumber(1000),
      });

    expect(tx.isRejected()).toBeTruthy();
    expect(contract.isRejected()).toBeTruthy();
    expect(contract.status).toEqual(ContractStatus.Rejected);
  });

  it('if the transaction.receipt.success === false, status should be rejected', async () => {
    const responses = [
      {
        id: 1,
        jsonrpc: '2.0',
        result: {
          balance: 888,
          nonce: 1,
        },
      },
      {
        id: 1,
        jsonrpc: '2.0',
        result: {
          TranID: 'some_hash',
        },
      },
      {
        id: 1,
        jsonrpc: '2.0',
        result: {
          ID: 'some_hash',
          receipt: {
            success: false,
            cumulative_gas: 1000,
          },
        },
      },
    ].map((res) => [JSON.stringify(res)] as [string]);

    fetch.mockResponses(...responses);

    const [tx, contract] = await contractFactory
      .new(
        testContract,
        [
          {
            vname: 'contractOwner',
            type: 'ByStr20',
            value: '0x124567890124567890124567890124567890',
          },
          { vname: 'name', type: 'String', value: 'NonFungibleToken' },
          { vname: 'symbol', type: 'String', value: 'NFT' },
        ],
        abi,
      )
      .deploy({
        version: VERSION,
        gasPrice: new BN(1000),
        gasLimit: Long.fromNumber(1000),
      });

    expect(tx.isRejected()).toBeTruthy();
    expect(contract.isRejected()).toBeTruthy();
  });

  it('should be able to call a transition', async () => {
    const responses = [
      {
        id: 1,
        jsonrpc: '2.0',
        result: {
          balance: 888,
          nonce: 1,
        },
      },
      {
        id: 1,
        jsonrpc: '2.0',
        result: {
          TranID: 'some_hash',
        },
      },
      {
        id: 1,
        jsonrpc: '2.0',
        result: {
          ID: 'some_hash',
          receipt: {
            success: true,
            cumulative_gas: 1000,
          },
        },
      },
      {
        id: 1,
        jsonrpc: '2.0',
        result: {
          balance: 888,
          nonce: 2,
        },
      },
      {
        id: 1,
        jsonrpc: '2.0',
        result: {
          TranID: 'some_hash',
        },
      },
      {
        id: 1,
        jsonrpc: '2.0',
        result: {
          ID: 'some_hash',
          receipt: {
            success: true,
            cumulative_gas: 1000,
          },
        },
      },
    ].map((res) => [JSON.stringify(res)] as [string]);

    fetch.mockResponses(...responses);

    const [, contract] = await contractFactory
      .new(
        testContract,
        [
          {
            vname: 'contractOwner',
            type: 'ByStr20',
            value: '0x124567890124567890124567890124567890',
          },
          { vname: 'name', type: 'String', value: 'NonFungibleToken' },
          { vname: 'symbol', type: 'String', value: 'NFT' },
        ],
        abi,
      )
      .deploy({
        version: VERSION,
        gasPrice: new BN(1000),
        gasLimit: Long.fromNumber(1000),
      });

    const callTx = await contract.call(
      'myTransition',
      [
        { vname: 'param_1', type: 'String', value: 'hello' },
        { vname: 'param_2', type: 'String', value: 'world' },
      ],
      {
        version: VERSION,
        amount: new BN(0),
        gasPrice: new BN(1000),
        gasLimit: Long.fromNumber(1000),
      },
    );

    const { receipt } = callTx.txParams;

    expect(receipt).toBeDefined();
    expect(receipt && receipt.success).toEqual(true);
  });
});
