import {Transaction, Wallet, util} from '@zilliqa/zilliqa-js-account';
import {
  Provider,
  ZilliqaModule,
  RPCResponse,
  RPCMethod,
  sign,
} from '@zilliqa/zilliqa-js-core';

import {DsBlockObj, BlockList, TxBlockObj, TransactionObj} from './types';
import {isError, toTxParams} from './util';

export default class Blockchain implements ZilliqaModule {
  signer: Wallet;
  provider: Provider;

  constructor(provider: Provider, signer: Wallet) {
    this.provider = provider;
    this.provider.middleware.request.use(
      util.formatOutgoingTx,
      RPCMethod.CreateTransaction,
    );
    this.signer = signer;
  }

  /**
   * getDSBlock
   *
   * Get details of a Directory Service block by block number.
   *
   * @param {number} blockNum
   * @returns {Promise<RPCResponse<DsBlockObj, string>>}
   */
  getDSBlock(blockNum: number): Promise<RPCResponse<DsBlockObj, string>> {
    return this.provider.send(RPCMethod.GetDSBlock, blockNum);
  }

  /**
   * getLatestDSBlock
   *
   * Get details of the most recent Directory Service block.
   *
   * @returns {Promise<RPCResponse<DsBlockObj, string>>}
   */
  getLatestDSBlock(): Promise<RPCResponse<DsBlockObj, string>> {
    return this.provider.send(RPCMethod.GetLatestDSBlock);
  }

  /**
   * getDsBlockListing
   *
   * Get a paginated list of Directory Service blocks. Pass in page number as
   * parameter. Returns a maxPages variable that specifies the max number of
   * pages. 1 - latest blocks, maxPages - oldest blocks.
   *
   * @param {number} max
   * @returns {Promise<RPCResponse<BlockList, string>>}
   */
  getDsBlockListing(max: number): Promise<RPCResponse<BlockList, string>> {
    return this.provider.send(RPCMethod.DSBlockListing);
  }

  /**
   * getTxBlock
   *
   * Get details of a Transaction block by block number.
   *
   * @param {number} blockNum
   * @returns {Promise<RPCResponse<TxBlockObj, string>>}
   */
  getTxBlock(blockNum: number): Promise<RPCResponse<TxBlockObj, string>> {
    return this.provider.send(RPCMethod.GetTxBlock, blockNum);
  }

  /**
   * getLatestTxBlock
   *
   * Get details of the most recent Transaction block.
   *
   * @returns {Promise<RPCResponse<TxBlockObj, string>>}
   */
  getLatestTxBlock(): Promise<RPCResponse<TxBlockObj, string>> {
    return this.provider.send(RPCMethod.GetLatestTxBlock);
  }

  /**
   * getTxBlockListing
   *
   * Get a paginated list of Transaction blocks. Pass in page number as
   * parameter. Returns a maxPages variable that specifies the max number of
   * pages. 1 - latest blocks, maxPages - oldest blocks.
   *
   * @param {number} max
   * @returns {Promise<RPCResponse<BlockList, string>>}
   */
  getTxBlockListing(max: number): Promise<RPCResponse<BlockList, string>> {
    return this.provider.send(RPCMethod.TxBlockListing, max);
  }

  /**
   * createTransaction
   *
   * Creates a transaction and polls the lookup node for a transaction
   * receipt. If, within the timeout, no transaction is found, the transaction
   * is considered as lost.
   *
   * @param {Transaction} payload
   * @returns {Promise<RPCResponse>}
   */
  @sign
  async createTransaction(tx: Transaction): Promise<Transaction> {
    try {
      const response = await this.provider.send(
        RPCMethod.CreateTransaction,
        tx.txParams,
      );

      return tx.confirm(response.result.TranID);
    } catch (err) {
      throw err;
    }
  }

  /**
   * getTransaction
   *
   * Retrieves a transaction from the blockchain by its hash. If the result
   * contains an Error, a rejected Promise is returned with the erorr message.
   * If it does not contained an error, but `receipt.success` is `false`, then
   * a rejected Transaction instance is returned.
   *
   * @param {string} txHash
   * @returns {Promise<any>}
   */
  async getTransaction(txHash: string): Promise<Transaction> {
    try {
      const response = await this.provider.send<TransactionObj>(
        RPCMethod.GetTransaction,
      );

      if (isError(response)) {
        return Promise.reject(response.result.Error);
      } else {
        return response.result.receipt.success
          ? Transaction.confirm(toTxParams(response), this.provider)
          : Transaction.reject(toTxParams(response), this.provider);
      }
    } catch (err) {
      throw err;
    }
  }
}
