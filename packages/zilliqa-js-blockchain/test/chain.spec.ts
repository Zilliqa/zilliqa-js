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
          receipt: { success: true },
        },
      },
    ].map((res) => [JSON.stringify(res)] as [string]);

    fetch.mockResponses(...responses);

    const { txParams } = await blockchain.createTransaction(tx);
    console.log('tx param = ', txParams);

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

  it('should test the maxAttempts parameter using blockConfirm', async () => {
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
});
