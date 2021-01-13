//  Copyright (C) 2018 Zilliqa
//
//  This file is part of Zilliqa-Javascript-Library.
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

import { Transaction, Wallet } from '@zilliqa-js/account';
import { HTTPProvider } from '@zilliqa-js/core';
import { BN, Long } from '@zilliqa-js/util';

import { Blockchain } from '../src/chain';

import fetch from 'jest-fetch-mock';

const provider = new HTTPProvider('https://mock.com');
const wallet = new Wallet(provider);
for (let i = 0; i < 10; i++) {
  wallet.create();
}

const blockchain = new Blockchain(provider, wallet);

describe('Module: Blockchain', () => {
  afterEach(() => {
    fetch.resetMocks();
  });

  it('should sign and send transactions', async () => {
    const tx = new Transaction(
      {
        version: 1,
        toAddr: '0x1234567890123456789012345678901234567890',
        amount: new BN(0),
        gasPrice: new BN(1000),
        gasLimit: Long.fromNumber(1000),
      },
      provider,
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
      {
        id: 1,
        jsonrpc: '2.0',
        result: {
          ID: 'some_hash',
          receipt: { success: true },
        },
      },
    ].map((res) => [JSON.stringify(res)] as [string]);

    fetch.mockResponses(...responses);

    const { txParams } = await blockchain.createTransaction(tx);

    expect(txParams).toHaveProperty('signature');
    expect(txParams).toHaveProperty('pubKey');
    expect(tx.isConfirmed()).toEqual(true);
  });

  it('should send raw transactions', async () => {
    const payload =
      '{"version":65537,"nonce":2,"toAddr":"39550aB45D74cCe5feF70e857c1326b2d9bEE096","pubKey":"03bb0637134af801bcc912f7cf61448aed05fea21f4a6460a7f15a48c8704f2aea","amount":"0","gasPrice":"1000000000","gasLimit":"40000","code":"","data":"{\\"_tag\\":\\"ProxyTransfer\\",\\"params\\":[{\\"vname\\":\\"to\\",\\"type\\":\\"ByStr20\\",\\"value\\":\\"0x0200a288be83e2a2061d7519d3397b3c6da05f29\\"},{\\"vname\\":\\"value\\",\\"type\\":\\"Uint128\\",\\"value\\":\\"10000000\\"}]}","signature":"8ae91f246b428248c73d6646e3c6d57ceb7877ad9d074e867b4860fbe7d248fbedfbd2a37822ab8610305756f643b76c62f2c7573c6ef0240e6af32d7ff106e6","priority":false}';

    const responses = [
      {
        id: 1,
        jsonrpc: '2.0',
        result: {
          TranID: 'some_hash',
          receipt: { success: true },
        },
      },
    ].map((res) => [JSON.stringify(res)] as [string]);

    fetch.mockResponses(...responses);
    const id = await blockchain.createTransactionRaw(payload);
    expect(id).toEqual('some_hash');
  });

  it('should handle error properly while sending raw transactions', async () => {
    const payload =
      '{"version":65537,"nonce":2,"toAddr":"39550aB45D74cCe5feF70e857c1326b2d9bEE096","pubKey":"03bb0637134af801bcc912f7cf61448aed05fea21f4a6460a7f15a48c8704f2aea","amount":"0","gasPrice":"1000000000","gasLimit":"40000","code":"","data":"{\\"_tag\\":\\"ProxyTransfer\\",\\"params\\":[{\\"vname\\":\\"to\\",\\"type\\":\\"ByStr20\\",\\"value\\":\\"0x0200a288be83e2a2061d7519d3397b3c6da05f29\\"},{\\"vname\\":\\"value\\",\\"type\\":\\"Uint128\\",\\"value\\":\\"10000000\\"}]}","signature":"8ae91f246b428248c73d6646e3c6d57ceb7877ad9d074e867b4860fbe7d248fbedfbd2a37822ab8610305756f643b76c62f2c7573c6ef0240e6af32d7ff106e6","priority":false}';

    const responses = [
      {
        id: 1,
        jsonrpc: '2.0',
        error: {
          code: -8,
          message: 'Nonce (1012) lower than current (1012)',
        },
      },
    ].map((res) => [JSON.stringify(res)] as [string]);

    fetch.mockResponses(...responses);
    try {
      await blockchain.createTransactionRaw(payload);
    } catch (error) {
      expect(error).toEqual({
        code: -8,
        message: 'Nonce (1012) lower than current (1012)',
      });
    }
  });

  it('should respect the maxAttempts parameter', async () => {
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
      ...(() => {
        const mocks = [];

        for (let i = 0; i < 40; i++) {
          mocks.push({
            id: 1,
            jsonrpc: '2.0',
            error: {
              code: -888,
              message: 'Not found',
            },
          });
        }

        return mocks;
      })(),
      {
        id: 1,
        jsonrpc: '2.0',
        result: {
          ID: 'some_hash',
          receipt: { cumulative_gas: '1000', success: true },
        },
      },
    ].map((res) => [JSON.stringify(res)] as [string]);

    fetch.mockResponses(...responses);

    const tx = new Transaction(
      {
        version: 0,
        toAddr: '0x1234567890123456789012345678901234567890',
        amount: new BN(0),
        gasPrice: new BN(1000),
        gasLimit: Long.fromNumber(1000),
      },
      provider,
    );

    await expect(blockchain.createTransaction(tx, 40, 0)).rejects.toThrow(
      'The transaction is still not confirmed after 40 attempts.',
    );
  });

  it('should receive transition array', async () => {
    const tx = new Transaction(
      {
        version: 1,
        toAddr: '0x1234567890123456789012345678901234567890',
        amount: new BN(0),
        gasPrice: new BN(1000),
        gasLimit: Long.fromNumber(1000),
      },
      provider,
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
      {
        id: 1,
        jsonrpc: '2.0',
        result: {
          ID: 'some_hash',
          receipt: {
            success: true,
            transitions: [
              {
                addr: '0xde641801b4c3a87298808ffe260ecf9b32bd958f',
                msg: {
                  _amount: '0',
                  _recipient: '0x0dcca194fa156e388f01b3c4b9993d031d596699',
                  _tag: 'callback',
                  params: [{ type: 'String', value: '5', vname: 'result' }],
                },
              },
            ],
          },
        },
      },
    ].map((res) => [JSON.stringify(res)] as [string]);

    fetch.mockResponses(...responses);

    const { txParams } = await blockchain.createTransaction(tx);
    expect(txParams.receipt).not.toBeNull();
    expect(txParams.receipt!.transitions).toEqual([
      {
        addr: '0xde641801b4c3a87298808ffe260ecf9b32bd958f',
        msg: {
          _amount: '0',
          _recipient: '0x0dcca194fa156e388f01b3c4b9993d031d596699',
          _tag: 'callback',
          params: [{ type: 'String', value: '5', vname: 'result' }],
        },
      },
    ]);
  });

  it('should receive transaction bodies', async () => {
    const responses = [
      {
        id: 1,
        jsonrpc: '2.0',
        result: [
          {
            ID: 'some_hash',
          },
        ],
      },
    ].map((res) => [JSON.stringify(res)] as [string]);

    fetch.mockResponses(...responses);

    const result = await blockchain.getTxnBodiesForTxBlock(1339810);
    expect(result.result).toBeDefined();
    // @ts-ignore
    expect(result.result.length).toEqual(1);
    // @ts-ignore
    expect(result.result[0].ID).toEqual('some_hash');
  });

  it('should receive transaction status with confirmed', async () => {
    const responses = [
      {
        id: 1,
        jsonrpc: '2.0',
        result: {
          ID:
            '96ba63371a57c9d4d7cbf448dbdd78d209c888a76a30413abd72691c16efffbb',
          gasLimit: '1',
          gasPrice: '2000000000',
          modificationState: 2,
          status: 3,
        },
      },
    ].map((res) => [JSON.stringify(res)] as [string]);

    fetch.mockResponses(...responses);

    const result = await blockchain.getTransactionStatus(
      '96ba63371a57c9d4d7cbf448dbdd78d209c888a76a30413abd72691c16efffbb',
    );
    expect(result.statusMessage).toEqual('Confirmed');
  });

  it('should receive pending transaction list', async () => {
    const responses = [
      {
        id: 1,
        jsonrpc: '2.0',
        result: {
          Txns: [
            {
              code: 1,
              TxnHash:
                'ec5ef8110a285563d0104269081aa77820058067091a9b3f3ae70f38b94abda3',
            },
          ],
        },
      },
    ].map((res) => [JSON.stringify(res)] as [string]);

    fetch.mockResponses(...responses);
    const result = await blockchain.getPendingTxns();
    expect(result.Txns).toBeDefined();
    // @ts-ignore
    expect(result.Txns).toEqual([
      {
        code: 1,
        TxnHash:
          'ec5ef8110a285563d0104269081aa77820058067091a9b3f3ae70f38b94abda3',
        info: 'Pending - nonce too high',
      },
    ]);
  });

  it('should receive miner info', async () => {
    const responses = [
      {
        id: 1,
        jsonrpc: '2.0',
        result: {
          dscommittee: [
            '0x03F25E4B68050496086758C33D16C47792F18D1102BB5DFC0CE5E3A57927008A0B',
            '0x03CF937B2EBE194C72350A6A7E6612C2D8636A33753929F1553E6273442B2F8E5B',
            '0x0372E43C4E7960F02E10F5AFE800E903579E2BE853B160681CBDF7C048FFB78A0F',
            ...'0x0397FD33ED459AD72939CA531385271311DA74094D89109F3876E81BEE84B4E414',
          ],
          shards: [
            {
              nodes: [
                '0x0245C0DDAA493700F86A3943260EB04D05DEBD62897E3EC51AE65A704E5C65C0A6',
                '0x0250CF4B40C0C984F2BB005599D2A7503F9C68F701A24CBC10B1EB2533575ADBA7',
                '0x023F2F657F170563E9B28BF837AB295FD13A7E2A4117DB44B2ADFE536F28D28102',
                ...'0x02358F60B4BD90805E6940A901E3C3A5867FFF5BDBD5AD9BFD66FE47C9FA6F1035',
              ],
              size: 535,
            },
            {
              nodes: [
                '0x02646640964F472CBE1E9BAF2DC5F1A0915AE529DDFF08F28DDE3E460C755DC8C4',
                '0x025EC6741880EC217F921A8FFB4AACDB95FF6477E1BB66CB39950FB2723D3740C8',
                '0x03DE42F6719E8A0147A93604C5F6A4304D14AD5F6A70C011EE37DBFC65D1E7F842',
                ...'0x02B1DB735BF54FC5765D89248DA1C07934282182F3C65CD9152D8F48C539BB5C53',
              ],
              size: 535,
            },
            {
              nodes: [
                '0x0218C2BA9876BCF3EE9EFF220C9F4CF433F5BE09D9D592F3C657AE7353CFFC3245',
                '0x02BCD61D2F47165E0CD6B3CF9429140C3F017C440DA63E9F44A84503A7D1E41590',
                '0x03E7699C19CFF554D265DC9C797713A7403D99A607EA7C8794259150436EB9FFBB',
                ...'0x031169CB469B6083954F578C19FC7833A90D835AA75942820119272FC6EE4361A5',
              ],
              size: 534,
            },
          ],
        },
      },
    ].map((res) => [JSON.stringify(res)] as [string]);

    fetch.mockResponses(...responses);

    const result = await blockchain.getMinerInfo('5500');
    expect(result.result).toBeDefined();
    // @ts-ignore
    expect(result.result.dscommittee).toEqual([
      '0x03F25E4B68050496086758C33D16C47792F18D1102BB5DFC0CE5E3A57927008A0B',
      '0x03CF937B2EBE194C72350A6A7E6612C2D8636A33753929F1553E6273442B2F8E5B',
      '0x0372E43C4E7960F02E10F5AFE800E903579E2BE853B160681CBDF7C048FFB78A0F',
      ...'0x0397FD33ED459AD72939CA531385271311DA74094D89109F3876E81BEE84B4E414',
    ]);
    // @ts-ignore
    expect(result.result.shards).toEqual([
      {
        nodes: [
          '0x0245C0DDAA493700F86A3943260EB04D05DEBD62897E3EC51AE65A704E5C65C0A6',
          '0x0250CF4B40C0C984F2BB005599D2A7503F9C68F701A24CBC10B1EB2533575ADBA7',
          '0x023F2F657F170563E9B28BF837AB295FD13A7E2A4117DB44B2ADFE536F28D28102',
          ...'0x02358F60B4BD90805E6940A901E3C3A5867FFF5BDBD5AD9BFD66FE47C9FA6F1035',
        ],
        size: 535,
      },
      {
        nodes: [
          '0x02646640964F472CBE1E9BAF2DC5F1A0915AE529DDFF08F28DDE3E460C755DC8C4',
          '0x025EC6741880EC217F921A8FFB4AACDB95FF6477E1BB66CB39950FB2723D3740C8',
          '0x03DE42F6719E8A0147A93604C5F6A4304D14AD5F6A70C011EE37DBFC65D1E7F842',
          ...'0x02B1DB735BF54FC5765D89248DA1C07934282182F3C65CD9152D8F48C539BB5C53',
        ],
        size: 535,
      },
      {
        nodes: [
          '0x0218C2BA9876BCF3EE9EFF220C9F4CF433F5BE09D9D592F3C657AE7353CFFC3245',
          '0x02BCD61D2F47165E0CD6B3CF9429140C3F017C440DA63E9F44A84503A7D1E41590',
          '0x03E7699C19CFF554D265DC9C797713A7403D99A607EA7C8794259150436EB9FFBB',
          ...'0x031169CB469B6083954F578C19FC7833A90D835AA75942820119272FC6EE4361A5',
        ],
        size: 534,
      },
    ]);
  });

  it('should test the maxAttempts parameter using blockConfirm', async () => {
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
      {
        id: 1,
        jsonrpc: '2.0',
        result: {
          header: {
            BlockNum: '10001',
          },
        },
      },

      {
        id: 1,
        jsonrpc: '2.0',
        result: {
          header: {
            BlockNum: '10001',
          },
        },
      },
      {
        id: 1,
        jsonrpc: '2.0',
        error: {
          code: -888,
          message: 'Not found',
        },
      },
      {
        id: 1,
        jsonrpc: '2.0',
        result: {
          header: {
            BlockNum: '10002',
          },
        },
      },
      {
        id: 1,
        jsonrpc: '2.0',
        error: {
          code: -888,
          message: 'Not found',
        },
      },
      {
        id: 1,
        jsonrpc: '2.0',
        result: {
          header: {
            BlockNum: '10003',
          },
        },
      },
      {
        id: 1,
        jsonrpc: '2.0',
        error: {
          code: -888,
          message: 'Not found',
        },
      },
      {
        id: 1,
        jsonrpc: '2.0',
        result: {
          header: {
            BlockNum: '10004',
          },
        },
      },
      {
        id: 1,
        jsonrpc: '2.0',
        error: {
          code: -888,
          message: 'Not found',
        },
      },
      {
        id: 1,
        jsonrpc: '2.0',
        result: {
          header: {
            BlockNum: '10004',
          },
        },
      },
      {
        id: 1,
        jsonrpc: '2.0',
        result: {
          ID: 'some_hash',
          receipt: { cumulative_gas: '1000', success: true },
        },
      },
    ].map((res) => [JSON.stringify(res)] as [string]);

    fetch.mockResponses(...responses);

    const tx = new Transaction(
      {
        version: 0,
        toAddr: '0x1234567890123456789012345678901234567890',
        amount: new BN(0),
        gasPrice: new BN(1000),
        gasLimit: Long.fromNumber(1000),
      },
      provider,
    );

    await expect(blockchain.createTransaction(tx, 4, 0, true)).rejects.toThrow(
      'The transaction is still not confirmed after 4 blocks.',
    );
  });

  it('should sign and send batch transactions with confirm', async () => {
    let txList = [];
    let mockTxIdList = [
      'ffb54c1f25e4bf95747712aebd62a9451a77557f86fb6c4895ee54d07615c4c2',
      'ca7f6a3001241eeb2fffbcb96bb4a60df23b2a94aafb921b26523813999f55b3',
    ];

    for (let i = 0; i < 2; i++) {
      const tx = new Transaction(
        {
          version: 1,
          toAddr: '0x1234567890123456789012345678901234567890',
          amount: new BN(0),
          gasPrice: new BN(1000),
          gasLimit: Long.fromNumber(1000),
        },
        provider,
      );
      txList.push(tx);
    }

    // mock the two transactions
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
          TranID: mockTxIdList[0],
          Info: 'Non-contract txn, sent to shard',
        },
      },
      {
        id: 1,
        jsonrpc: '2.0',
        result: {
          ID: mockTxIdList[0],
          receipt: { success: true },
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
          TranID: mockTxIdList[1],
          Info: 'Non-contract txn, sent to shard',
        },
      },
      {
        id: 1,
        jsonrpc: '2.0',
        result: {
          ID: mockTxIdList[1],
          receipt: { success: true },
        },
      },
    ].map((res) => [JSON.stringify(res)] as [string]);

    fetch.mockResponses(...responses);

    const batchResults = await blockchain.createBatchTransaction(txList);

    for (const index in batchResults) {
      expect(batchResults[index]).toHaveProperty('signature');
      expect(batchResults[index]).toHaveProperty('pubKey');
      expect(batchResults[index].isConfirmed()).toEqual(true);
      expect(batchResults[index].id).toEqual(mockTxIdList[index]);
    }
  });

  it('should send batch transactions without confirm', async () => {
    let txList = [];
    let mockTxIdList = [
      'ffb54c1f25e4bf95747712aebd62a9451a77557f86fb6c4895ee54d07615c4c2',
      'ca7f6a3001241eeb2fffbcb96bb4a60df23b2a94aafb921b26523813999f55b3',
    ];

    for (let i = 0; i < 2; i++) {
      const tx = new Transaction(
        {
          version: 1,
          toAddr: '0x1234567890123456789012345678901234567890',
          amount: new BN(0),
          gasPrice: new BN(1000),
          gasLimit: Long.fromNumber(1000),
        },
        provider,
      );
      txList.push(tx);
    }

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
          TranID: mockTxIdList[0],
          Info: 'Non-contract txn, sent to shard',
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
          TranID: mockTxIdList[1],
          Info: 'Non-contract txn, sent to shard',
        },
      },
    ].map((res) => [JSON.stringify(res)] as [string]);

    fetch.mockResponses(...responses);

    const batchResults = await blockchain.createBatchTransactionWithoutConfirm(
      txList,
    );

    for (const index in batchResults) {
      expect(batchResults[index]).toHaveProperty('signature');
      expect(batchResults[index]).toHaveProperty('pubKey');
      expect(batchResults[index].id).toEqual(mockTxIdList[index]);
    }
  });
});
