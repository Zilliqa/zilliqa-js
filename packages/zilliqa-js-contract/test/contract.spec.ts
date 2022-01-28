//  Copyright (C) 2018 Zilliqa
//
//  This file is part of zilliqa-js
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU General Public License for more details.
//
//  You should have received a copy of the GNU General Public License
//  along with this program.  If not, see <https://www.gnu.org/licenses/>.

import { Wallet } from '@zilliqa-js/account';
import { HTTPProvider } from '@zilliqa-js/core';
import { fromBech32Address, isValidChecksumAddress } from '@zilliqa-js/crypto';
import { BN, bytes, Long } from '@zilliqa-js/util';

import fetch, { MockParams } from 'jest-fetch-mock';

import { Contracts, ContractStatus } from '../src/index';
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
          balance: '39999999000000000',
          nonce: 1,
        },
      },
      {
        id: 1,
        jsonrpc: '2.0',
        result: {
          ContractAddress: `0x0000000000000000000000000000000000000000`,
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
    ].map(
      (res) => [JSON.stringify(res), { status: 200 }] as [string, MockParams],
    );

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
          balance: '39999999000000000',
          nonce: 1,
        },
      },
      {
        id: 1,
        jsonrpc: '2.0',
        result: {
          ContractAddress: `0x0000000000000000000000000000000000000000`,
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
    ].map(
      (res) => [JSON.stringify(res), { status: 200 }] as [string, MockParams],
    );

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

  it('should be able to deploy a contract without confirmation', async () => {
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
          balance: '39999999000000000',
          nonce: 1,
        },
      },
      {
        id: 1,
        jsonrpc: '2.0',
        result: {
          ContractAddress: `0x0000000000000000000000000000000000000000`,
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
    ].map(
      (res) => [JSON.stringify(res), { status: 200 }] as [string, MockParams],
    );

    fetch.mockResponses(...responses);

    const [tx, deployedContract] = await contract.deployWithoutConfirm({
      version: VERSION,
      gasPrice: new BN(1000),
      gasLimit: Long.fromNumber(1000),
    });

    expect(tx.id).toEqual('some_hash');
    expect(tx.isPending()).toBeTruthy();
    expect(deployedContract.status).toEqual(ContractStatus.Initialised);
    expect(deployedContract.address).toEqual(
      '0x0000000000000000000000000000000000000000',
    );
  });

  it('should be rejected if underling transaction fails for deploy without confirmation', async () => {
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
          balance: '39999999000000000',
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
    ].map(
      (res) => [JSON.stringify(res), { status: 200 }] as [string, MockParams],
    );

    fetch.mockResponses(...responses);

    const [tx, deployedContract] = await contract.deployWithoutConfirm({
      version: VERSION,
      gasPrice: new BN(1000),
      gasLimit: Long.fromNumber(1000),
    });

    expect(tx.isRejected()).toBeTruthy();
    expect(deployedContract.status).toEqual(ContractStatus.Rejected);
    expect(deployedContract.address).toEqual(undefined);
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
          balance: '39999999000000000',
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
    ].map(
      (res) => [JSON.stringify(res), { status: 200 }] as [string, MockParams],
    );

    fetch
      .mockResponses(...(responses as any))
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
          balance: '39999999000000000',
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
    ].map(
      (res) => [JSON.stringify(res), { status: 200 }] as [string, MockParams],
    );

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
          balance: '39999999000000000',
          nonce: 1,
        },
      },
      {
        id: 1,
        jsonrpc: '2.0',
        result: {
          TranID: 'some_hash',
          ContractAddress: `0x0000000000000000000000000000000000000000`,
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
    ].map(
      (res) => [JSON.stringify(res), { status: 200 }] as [string, MockParams],
    );

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
          balance: '39999999000000000',
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
          senderPubKey:
            '0314738163B9BB67AD11AA464FE69A1147DF263E8970D7DCFD8F993DDD39E81BD9',
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
          balance: '39999999000000000',
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
          senderPubKey:
            '0314738163B9BB67AD11AA464FE69A1147DF263E8970D7DCFD8F993DDD39E81BD9',
          receipt: {
            success: true,
            cumulative_gas: 1000,
          },
        },
      },
    ].map(
      (res) => [JSON.stringify(res), { status: 200 }] as [string, MockParams],
    );

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

  it('should be able to call a transition without confirmation', async () => {
    const responses = [
      {
        id: 1,
        jsonrpc: '2.0',
        result: {
          balance: '39999999000000000',
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
          senderPubKey:
            '0314738163B9BB67AD11AA464FE69A1147DF263E8970D7DCFD8F993DDD39E81BD9',
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
          balance: '39999999000000000',
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
          senderPubKey:
            '0314738163B9BB67AD11AA464FE69A1147DF263E8970D7DCFD8F993DDD39E81BD9',
          receipt: {
            success: true,
            cumulative_gas: 1000,
          },
        },
      },
    ].map(
      (res) => [JSON.stringify(res), { status: 200 }] as [string, MockParams],
    );

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

    const callTx = await contract.callWithoutConfirm(
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

    expect(callTx.id).toEqual('some_hash');
    expect(callTx.isPending()).toBeTruthy();
  });

  it('should accept base16 address', () => {
    const contractAt = contractFactory.at(
      '0xE8A997e359AC2A1e891dBDf7fc7558623bB0eaD2'.toLocaleLowerCase(),
    );
    expect(isValidChecksumAddress(contractAt.address!)).toBe(true);
  });

  it('should call getState and getInit with the correct parameters', async () => {
    const b32 = 'zil1az5e0c6e4s4pazgahhmlca2cvgamp6kjtaxf4q';
    const b16 = fromBech32Address(b32).replace('0x', '').toLowerCase();
    const contractAt = contractFactory.atBech32(b32);

    const sendMock = jest.fn().mockResolvedValue({ result: 'mock' });

    contractAt.provider.send = sendMock;
    await contractAt.getInit();
    await contractAt.getState();

    const [[, addressGetInit], [, addressGetState]] = sendMock.mock.calls;

    expect(addressGetInit).toEqual(b16);
    expect(addressGetState).toEqual(b16);
  });
});
