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

import { Transaction, Wallet } from '@zilliqa-js/account';
import { HTTPProvider } from '@zilliqa-js/core';
import { BN, Long } from '@zilliqa-js/util';

import { Blockchain } from '../src/chain';

import fetch, { MockParams } from 'jest-fetch-mock';

const provider = new HTTPProvider('https://mock.com');
const wallet = new Wallet(provider);
for (let i = 0; i < 10; i++) {
  wallet.create();
}

const blockchain = new Blockchain(provider, wallet);

const getExpectedReq = (method: string, params: any) => {
  return {
    url: 'https://mock.com',
    payload: {
      id: 1,
      jsonrpc: '2.0',
      method,
      params,
    },
  };
};

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
    ].map(
      (res) => [JSON.stringify(res), { status: 200 }] as [string, MockParams],
    );

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
    ].map(
      (res) => [JSON.stringify(res), { status: 200 }] as [string, MockParams],
    );

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
    ].map(
      (res) => [JSON.stringify(res), { status: 200 }] as [string, MockParams],
    );

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
    ].map(
      (res) => [JSON.stringify(res), { status: 200 }] as [string, MockParams],
    );

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
    ].map(
      (res) => [JSON.stringify(res), { status: 200 }] as [string, MockParams],
    );

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

  it('validates params for GetTransactionsForTxBlockEx', async () => {
    const sampleResponse = {
      id: '1',
      jsonrpc: '2.0',
      result: {
        CurrPage: 2,
        NumPages: 5,
        Transactions: [
          [
            '0a9b4733bff6be2d48020f42e561a89d735eeb809eda257b6a56712223e842eb',
            '01924067b8d120de35c72bf7213faa12d8b6d20dfc867a027a39799090fd2bad',
            '321fe2ed656c622c14d4c7919080086bc95fa57f52a235966cf2c3661dc2fbc5',
            '3e0eee38171169b7f179035fd02e40f74d698d05733597115ef67ae2034a7b48',
          ],
          [
            '000d1ab6963ff7c3db82fcce858e93fa264f7d39010099482ab965a518566195',
            '6374f8d23d2aa96e3b205a677ad0569bf087d8a099ce90c2869bfca8588f11eb',
            '6ad9c1aca7106ace4b836c677ac4a850f611349725358c541741842fb12b4d8d',
            'd116b78ddd5a30bc1a27495f9227af1cd62a90766eaaba7610a395aeab78ee10',
          ],
          [],
          [],
        ],
      },
    };
    fetch.mockResponse(JSON.stringify(sampleResponse));

    const testCases = [
      // Nagative Test Cases
      {
        params: [-1],
        expectedReqParams: undefined,
        result: undefined,
        error: 'invalid txBlock',
      },
      {
        params: [0.1234],
        expectedReqParams: undefined,
        result: undefined,
        error: 'invalid txBlock',
      },
      {
        params: [Infinity],
        expectedReqParams: undefined,
        result: undefined,
        error: 'invalid txBlock',
      },
      {
        params: ['one'],
        expectedReqParams: undefined,
        result: undefined,
        error: 'invalid txBlock',
      },

      // Positive Test Cases
      {
        params: [0],
        expectedReqParams: ['0'],
        result: sampleResponse,
        error: undefined,
      },
      {
        params: [10],
        expectedReqParams: ['10'],
        result: sampleResponse,
        error: undefined,
      },
    ];

    for (const t of testCases) {
      if (t.error) {
        try {
          await blockchain.getTransactionsForTxBlockEx(t.params[0] as number);
          expect(true).toBe(false);
        } catch (error) {
          if (error instanceof Error) {
            expect(error.message).toBe(t.error);
          }
        }
      } else {
        const res = await blockchain.getTransactionsForTxBlockEx(
          t.params[0] as number,
        );
        const req = getExpectedReq(
          'GetTransactionsForTxBlockEx',
          t.expectedReqParams,
        );
        const expectedRes = { req, ...t.result };
        expect(res).toEqual(expectedRes);
      }
    }
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
    ].map(
      (res) => [JSON.stringify(res), { status: 200 }] as [string, MockParams],
    );

    fetch.mockResponses(...responses);

    const result = await blockchain.getTxnBodiesForTxBlock(1339810);
    expect(result.result).toBeDefined();
    // @ts-ignore
    expect(result.result.length).toEqual(1);
    // @ts-ignore
    expect(result.result[0].ID).toEqual('some_hash');
  });

  it('validates params for GetTxnBodiesForTxBlockEx', async () => {
    const sampleResponse = {
      id: '1',
      jsonrpc: '2.0',
      result: {
        CurrPage: 2,
        NumPages: 5,
        Transactions: [
          {
            ID: '0a9b4733bff6be2d48020f42e561a89d735eeb809eda257b6a56712223e842eb',
            amount: '0',
            gasLimit: '1',
            gasPrice: '2000000000',
            nonce: '96538',
            receipt: {
              cumulative_gas: '1',
              epoch_num: '1002353',
              success: true,
            },
            senderPubKey:
              '0x0235372F21184432428ABCDF99385FFF3A4EC346942B51FACBE9589DDF482C5D45',
            signature:
              '0x1A7CD80504D1BD75C50F751C08FC36ACC0F1A94852048179BCC927A3D5BC297AF01FB0A9CADBEC9AB870D330C8E2931E7025AE1293CE66B7429ABC44E785F16B',
            toAddr: '43b358e23092e2d367cedcd08c513fdca2162c01',
            version: '65537',
          },
          {
            ID: 'd116b78ddd5a30bc1a27495f9227af1cd62a90766eaaba7610a395aeab78ee10',
            amount: '0',
            gasLimit: '1',
            gasPrice: '2000000000',
            nonce: '98068',
            receipt: {
              cumulative_gas: '1',
              epoch_num: '1002353',
              success: true,
            },
            senderPubKey:
              '0x02FBB56136F2BBC10C963CCB8FA19287926A655023AB137BB018D2C65238D0F481',
            signature:
              '0xC6C4B4060026631F6F79BB5D6B163A51729E11A92D0E217F3ABCD38D2A8E733C62A9EBADA184DEAD5859BBE68ABD888E3A0B194B260FF7A9ACD58523A37EF896',
            toAddr: '43b358e23092e2d367cedcd08c513fdca2162c01',
            version: '65537',
          },
        ],
      },
    };
    fetch.mockResponse(JSON.stringify(sampleResponse));

    const testCases = [
      // Nagative Test Cases
      {
        params: [-1],
        expectedReqParams: undefined,
        result: undefined,
        error: 'invalid txBlock',
      },
      {
        params: [0.1234],
        expectedReqParams: undefined,
        result: undefined,
        error: 'invalid txBlock',
      },
      {
        params: [Infinity],
        expectedReqParams: undefined,
        result: undefined,
        error: 'invalid txBlock',
      },
      {
        params: ['one'],
        expectedReqParams: undefined,
        result: undefined,
        error: 'invalid txBlock',
      },

      // Positive Test Cases
      {
        params: [0],
        expectedReqParams: ['0'],
        result: sampleResponse,
        error: undefined,
      },
      {
        params: [10],
        expectedReqParams: ['10'],
        result: sampleResponse,
        error: undefined,
      },
    ];

    for (const t of testCases) {
      if (t.error) {
        try {
          await blockchain.getTxnBodiesForTxBlockEx(t.params[0] as number);
          expect(true).toBe(false);
        } catch (error) {
          if (error instanceof Error) {
            expect(error.message).toBe(t.error);
          }
        }
      } else {
        const res = await blockchain.getTxnBodiesForTxBlockEx(
          t.params[0] as number,
        );
        const req = getExpectedReq(
          'GetTxnBodiesForTxBlockEx',
          t.expectedReqParams,
        );
        const expectedRes = { req, ...t.result };
        expect(res).toEqual(expectedRes);
      }
    }
  });

  it('should receive transaction status with confirmed', async () => {
    const responses = [
      {
        id: 1,
        jsonrpc: '2.0',
        result: {
          ID: '96ba63371a57c9d4d7cbf448dbdd78d209c888a76a30413abd72691c16efffbb',
          gasLimit: '1',
          gasPrice: '2000000000',
          modificationState: 2,
          status: 3,
        },
      },
    ].map(
      (res) => [JSON.stringify(res), { status: 200 }] as [string, MockParams],
    );

    fetch.mockResponses(...responses);

    const result = await blockchain.getTransactionStatus(
      '96ba63371a57c9d4d7cbf448dbdd78d209c888a76a30413abd72691c16efffbb',
    );
    expect(result.statusMessage).toEqual('Confirmed');
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
    ].map(
      (res) => [JSON.stringify(res), { status: 200 }] as [string, MockParams],
    );

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
    ].map(
      (res) => [JSON.stringify(res), { status: 200 }] as [string, MockParams],
    );

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
    const txList = [];
    const mockTxIdList = [
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
        // sign txn
        id: 1,
        jsonrpc: '2.0',
        result: {
          balance: '39999999000000000',
          nonce: 1,
        },
      },
      [
        {
          // batch response
          id: 1,
          jsonrpc: '2.0',
          result: {
            TranID: mockTxIdList[0],
            receipt: {
              cumulative_gas: '1000',
              success: true,
            },
          },
        },
        {
          // batch response
          id: 1,
          jsonrpc: '2.0',
          result: {
            TranID: mockTxIdList[1],
            receipt: {
              cumulative_gas: '1000',
              success: true,
            },
          },
        },
      ],
      {
        // txn confirm
        id: 1,
        jsonrpc: '2.0',
        result: {
          ID: mockTxIdList[0],
          TranID: mockTxIdList[0],
          Info: 'Non-contract txn, sent to shard',
          receipt: {
            cumulative_gas: '1000',
            success: true,
          },
        },
      },
      {
        // txn confirm
        id: 1,
        jsonrpc: '2.0',
        result: {
          ID: mockTxIdList[1],
          TranID: mockTxIdList[1],
          Info: 'Non-contract txn, sent to shard',
          receipt: {
            cumulative_gas: '1000',
            success: true,
          },
        },
      },
    ].map(
      (res) => [JSON.stringify(res), { status: 200 }] as [string, MockParams],
    );

    fetch.mockResponses(...responses);

    const signedTxList = await wallet.signBatch(txList);
    const batchResults = await blockchain.createBatchTransaction(signedTxList);

    for (const index in batchResults) {
      expect(batchResults[index]).toHaveProperty('signature');
      expect(batchResults[index]).toHaveProperty('pubKey');
      expect(batchResults[index].isConfirmed()).toEqual(true);
      expect(batchResults[index].id).toEqual(mockTxIdList[index]);
    }
  });

  it('should send batch transactions without confirm', async () => {
    const txList = [];
    const mockTxIdList = [
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
      [
        {
          // batch response
          id: 1,
          jsonrpc: '2.0',
          result: {
            TranID: mockTxIdList[0],
            receipt: {
              cumulative_gas: '1000',
              success: true,
            },
          },
        },
        {
          // batch response
          id: 1,
          jsonrpc: '2.0',
          result: {
            TranID: mockTxIdList[1],
            receipt: {
              cumulative_gas: '1000',
              success: true,
            },
          },
        },
      ],
    ].map(
      (res) => [JSON.stringify(res), { status: 200 }] as [string, MockParams],
    );

    fetch.mockResponses(...responses);

    const signedTxList = await wallet.signBatch(txList);
    const batchResults = await blockchain.createBatchTransactionWithoutConfirm(
      signedTxList,
    );

    for (const index in batchResults) {
      expect(batchResults[index]).toHaveProperty('signature');
      expect(batchResults[index]).toHaveProperty('pubKey');
      expect(batchResults[index].id).toEqual(mockTxIdList[index]);
    }
  });

  it('should throw error if batch transactions with confirm is unsigned', async () => {
    const txList = [];

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

    await expect(blockchain.createBatchTransaction(txList)).rejects.toThrow(
      'The transaction is not signed.',
    );
  });

  it('should throw error if batch transactions without confirm is unsigned', async () => {
    const txList = [];

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

    await expect(
      blockchain.createBatchTransactionWithoutConfirm(txList),
    ).rejects.toThrow('The transaction is not signed.');
  });

  it('validates params for GetStateProof', async () => {
    const sampleResponse = {
      id: 1,
      jsonrpc: '2.0',
      result: {
        accountProof: [
          'F851808080A0C7083D05AC726A32DC3313B5CA7526449EFCADAB51179A47B60901C63B108E908080A0BC76B4E969C8214F2DF641D3F387AA35CDBF17EEB54D23F5F01B4E688AB2A21980808080808080808080',
          'F871808080A0D5FE2E3CEA6C64AD708DFAD93B79FC9894C5A5AE59372D3C3872C1C8143CD749A087B1E084016657B3F8D32B429AE8055A63F12811DDFDC3AA8E863F25A03781F4A0AEDA08F7295A9E63544F9EAE728EBF98D571A07757E4BD95C91749CE9CC40B858080808080808080808080',
          'F887A820376538396338303535623466306165633037376235396535646461326662346331346638313466B85C080112120A10000000000000000000000000000000001800222045EEB1C2D2462F819E2CA893329EEB25FA29199160C28C8DDF30A10E04CCF05D2A20DDD90D4C45815116C8F23802FC3E5ED0B6D8B6A2A25EAF63680A406A33094A85',
        ],
        stateProof: [
          'E213A01CE797360949BDEBE357D68D54CD592D300084732CEE4F93A4ED41BDDBACD016',
          'E216A042A6C50E3845BDB58866500B65D1721DD45AC4E8BE0A4FEE6AEB4E0140D9E4E3',
          'F841B83E203533393936303466316439303130376230396232393832326630643534636638633038656532623931663165353062316435363336643331393062376532',
          'F851808080A04569AAF476CCD06BA5F31049E02C00C6FD1B6AF44C90F9EF139F6DA919B0D1FA8080A0F27A4D7A3733D624A18316E4F9D1785349462FE39EA3842A62CDF2B4D7A29B8880808080808080808080',
          'F8518080A0CA36C33D7030330EA93A73F03A8E8B05F3661C268D79184168BA5D93B0F91009808080A053C216D9015F58FF44AC4984F2482A4B06E27B7284680D9DF0BDF5494F0048EF80808080808080808080',
          'F85180A0F61D98347C0929D0A2F9354110BB4FD2F0DE083AE1B1D8AEDAA961FA5D7803108080A0F637E8D9A259DF234DB75FF9983B10D57C8B0B8015D07003F0EB6C86732465DF808080808080808080808080',
          'F90111A098D43DC741B140DDAC365E4AF6C49E4C4E9C30D2B589C85490527ADB5407682880A0B8E67BDA2445251B34AE4E78D06E60CE7C5394127B0D847E79A618F53B4064DCA0278A99201A4DB0533B1DD2AF5674B4F7A4242B95675E3014AEAB6792B102B96FA0BEE54BAD23D8DCC3C04FEF75278186234CD3AEB04A0ED5873B36E18B30DFD882A01B2ACF79D7F6064E6A1EBE1084EC8A934EAE06DCEDA8FE58AC709A0821B1251D80A0D2745A95263E0BAEDEDBDD60E3ADBEB9010DA902701263792193B27B1C06EDE9A08578DA8C3BD2970F97D569AD389222809409B7960783033BF2D5614162EA3D66A07D115995BCF7A4E9920F0A34A5BE6F0A43A21A734A5E7C421F76B5F5BFF6128380808080808080',
        ],
      },
    };
    fetch.mockResponse(JSON.stringify(sampleResponse));

    const testCases = [
      // Nagative Test Cases
      {
        params: [
          '6d84363526a2d764835f8cf52dfeefe80a360fac',
          'A0BD91DE66D97E6930118179BA4F1836C366C4CB3309A6B354D26F52ABB2AAC6',
          -1,
        ],
        expectedReqParams: undefined,
        result: undefined,
        error: 'invalid txBlock',
      },
      {
        params: [
          '6d84363526a2d764835f8cf52dfeefe80a360fac',
          'A0BD91DE66D97E6930118179BA4F1836C366C4CB3309A6B354D26F52ABB2AAC6',
          0.1234,
        ],
        expectedReqParams: undefined,
        result: undefined,
        error: 'invalid txBlock',
      },
      {
        params: [
          '6d84363526a2d764835f8cf52dfeefe80a360fac',
          'A0BD91DE66D97E6930118179BA4F1836C366C4CB3309A6B354D26F52ABB2AAC6',
          Infinity,
        ],
        expectedReqParams: undefined,
        result: undefined,
        error: 'invalid txBlock',
      },
      {
        params: [
          '6d84363526a2d764835f8cf52dfeefe80a360fac',
          'A0BD91DE66D97E6930118179BA4F1836C366C4CB3309A6B354D26F52ABB2AAC6',
          'last',
        ],
        expectedReqParams: undefined,
        result: undefined,
        error: 'invalid txBlock',
      },

      // Positive Test Cases
      {
        params: [
          'zil1z98c4cgz8c6k3sxpakv7vfsa6k04hpvn7lf8sr',
          'A0BD91DE66D97E6930118179BA4F1836C366C4CB3309A6B354D26F52ABB2AAC6',
          10,
        ],
        expectedReqParams: [
          '114f8ae1023e3568c0c1ed99e6261dd59f5b8593',
          'A0BD91DE66D97E6930118179BA4F1836C366C4CB3309A6B354D26F52ABB2AAC6',
          '10',
        ],
        result: sampleResponse,
        error: undefined,
      },
      {
        params: [
          '0x6d84363526a2d764835f8cf52dfeefe80a360fac',
          'A0BD91DE66D97E6930118179BA4F1836C366C4CB3309A6B354D26F52ABB2AAC6',
          10,
        ],
        expectedReqParams: [
          '6d84363526a2d764835f8cf52dfeefe80a360fac',
          'A0BD91DE66D97E6930118179BA4F1836C366C4CB3309A6B354D26F52ABB2AAC6',
          '10',
        ],
        result: sampleResponse,
        error: undefined,
      },
      {
        params: [
          '6d84363526a2d764835f8cf52dfeefe80a360fac',
          'A0BD91DE66D97E6930118179BA4F1836C366C4CB3309A6B354D26F52ABB2AAC6',
          10,
        ],
        expectedReqParams: [
          '6d84363526a2d764835f8cf52dfeefe80a360fac',
          'A0BD91DE66D97E6930118179BA4F1836C366C4CB3309A6B354D26F52ABB2AAC6',
          '10',
        ],
        result: sampleResponse,
        error: undefined,
      },
      {
        params: [
          '6d84363526a2d764835f8cf52dfeefe80a360fac',
          'A0BD91DE66D97E6930118179BA4F1836C366C4CB3309A6B354D26F52ABB2AAC6',
          'latest',
        ],
        expectedReqParams: [
          '6d84363526a2d764835f8cf52dfeefe80a360fac',
          'A0BD91DE66D97E6930118179BA4F1836C366C4CB3309A6B354D26F52ABB2AAC6',
          'latest',
        ],
        result: sampleResponse,
        error: undefined,
      },
    ];

    for (const t of testCases) {
      if (t.error) {
        try {
          await blockchain.getStateProof(
            t.params[0] as string,
            t.params[1] as string,
            t.params[2],
          );
          expect(true).toBe(false);
        } catch (error) {
          if (error instanceof Error) {
            expect(error.message).toBe(t.error);
          }
        }
      } else {
        const res = await blockchain.getStateProof(
          t.params[0] as string,
          t.params[1] as string,
          t.params[2],
        );
        const req = getExpectedReq('GetStateProof', t.expectedReqParams);
        const expectedRes = { req, ...t.result };
        expect(res).toEqual(expectedRes);
      }
    }
  });
});
