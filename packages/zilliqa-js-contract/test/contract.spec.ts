import axios from 'axios';
import BN from 'bn.js';

import { Wallet } from '@zilliqa/zilliqa-js-account';
import { HTTPProvider } from '@zilliqa/zilliqa-js-core';

import fetch from 'jest-fetch-mock';

import { ContractStatus, Contracts } from '../src/index';
import { abi } from './test.abi';
import { testContract } from './fixtures';

const provider = new HTTPProvider('https://mock.com');
const wallet = new Wallet(provider);
const contractFactory = new Contracts(provider, wallet);
wallet.create();

describe('Contracts', () => {
  afterEach(() => {
    fetch.resetMocks();
  });

  it('should be able to deploy a contract', async () => {
    const contract = contractFactory.new(abi, testContract, [
      {
        vname: 'contractOwner',
        type: 'ByStr20',
        value: '0x124567890124567890124567890124567890',
      },
      { vname: 'name', type: 'String', value: 'NonFungibleToken' },
      { vname: 'symbol', type: 'String', value: 'NFT' },
    ]);

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

    const deployTx = await contract.deploy(new BN(1000), new BN(1000));

    expect(deployTx.status).toEqual(ContractStatus.Deployed);
    expect(contract.address).toMatch(/[A-F0-9]+/);
  });

  it('should not swallow network errors', async () => {
    const contract = contractFactory.new(abi, testContract, [
      {
        vname: 'contractOwner',
        type: 'ByStr20',
        value: '0x124567890124567890124567890124567890',
      },
      { vname: 'name', type: 'String', value: 'NonFungibleToken' },
      { vname: 'symbol', type: 'String', value: 'NFT' },
    ]);

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

    await expect(contract.deploy(new BN(1000), new BN(1000))).rejects.toThrow();
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
        result: {
          Error: 'Mega fail',
        },
      },
    ].map((res) => [JSON.stringify(res)] as [string]);

    fetch.mockResponses(...responses);

    const contract = await contractFactory
      .new(abi, testContract, [
        {
          vname: 'contractOwner',
          type: 'ByStr20',
          value: '0x124567890124567890124567890124567890',
        },
        { vname: 'name', type: 'String', value: 'NonFungibleToken' },
        { vname: 'symbol', type: 'String', value: 'NFT' },
      ])
      .deploy(new BN(1000), new BN(1000));

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

    const contract = await contractFactory
      .new(abi, testContract, [
        {
          vname: 'contractOwner',
          type: 'ByStr20',
          value: '0x124567890124567890124567890124567890',
        },
        { vname: 'name', type: 'String', value: 'NonFungibleToken' },
        { vname: 'symbol', type: 'String', value: 'NFT' },
      ])
      .deploy(new BN(1000), new BN(1000));

    expect(contract.status).toEqual(ContractStatus.Rejected);
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

    const contract = await contractFactory
      .new(abi, testContract, [
        {
          vname: 'contractOwner',
          type: 'ByStr20',
          value: '0x124567890124567890124567890124567890',
        },
        { vname: 'name', type: 'String', value: 'NonFungibleToken' },
        { vname: 'symbol', type: 'String', value: 'NFT' },
      ])
      .deploy(new BN(1000), new BN(1000));

    const callTx = await contract.call('myTransition', [
      { vname: 'param_1', type: 'String', value: 'hello' },
      { vname: 'param_2', type: 'String', value: 'world' },
    ]);

    const { receipt } = callTx.txParams;

    expect(receipt).toBeDefined;
    expect(receipt && receipt.success).toEqual(true);
  });
});
