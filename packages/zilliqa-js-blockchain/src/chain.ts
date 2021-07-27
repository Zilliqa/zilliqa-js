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

import { Transaction, util, Wallet } from '@zilliqa-js/account';
import { fromBech32Address } from '@zilliqa-js/crypto';
import { validation } from '@zilliqa-js/util';
import { ContractObj, Value } from '@zilliqa-js/contract';
import {
  BlockchainInfo,
  BlockList,
  DsBlockObj,
  GET_TX_ATTEMPTS,
  TransactionStatusObj,
  Provider,
  RPCMethod,
  RPCResponse,
  ShardingStructure,
  sign,
  TransactionObj,
  MinerInfo,
  TxBlockObj,
  TxList,
  ZilliqaModule,
} from '@zilliqa-js/core';

import { toTxParams } from './util';

export class Blockchain implements ZilliqaModule {
  signer: Wallet;
  provider: Provider;
  pendingErrorMap: { [key: number]: string } = {
    0: 'Transaction not found',
    1: 'Pending - Dispatched',
    2: 'Pending - Soft-confirmed (awaiting Tx block generation)',
    4: 'Pending - Nonce is higher than expected',
    5: 'Pending - Microblock gas limit exceeded',
    6: 'Pending - Consensus failure in network',
    3: 'Confirmed',
    10: 'Rejected - Transaction caused math error',
    11: 'Rejected - Scilla invocation error',
    12: 'Rejected - Contract account initialization error',
    13: 'Rejected - Invalid source account',
    14: 'Rejected - Gas limit higher than shard gas limit',
    15: 'Rejected - Unknown transaction type',
    16: 'Rejected - Transaction sent to wrong shard',
    17: 'Rejected - Contract & source account cross-shard issue',
    18: 'Rejected - Code size exceeded limit',
    19: 'Rejected - Transaction verification failed',
    20: 'Rejected - Gas limit too low',
    21: 'Rejected - Insufficient balance',
    22: 'Rejected - Insufficient gas to invoke Scilla checker',
    23: 'Rejected - Duplicate transaction exists',
    24: 'Rejected - Transaction with same nonce but same/higher gas price exists',
    25: 'Rejected - Invalid destination address',
    26: 'Rejected - Failed to add contract account to state',
    27: 'Rejected - Nonce is lower than expected',
    255: 'Rejected - Internal error',
  };

  transactionStatusMap: { [key: number]: { [key: number]: string } } = {
    0: { 0: 'Transaction not found', 1: ' Pending - Dispatched' },
    1: {
      2: 'Pending - Soft-confirmed (awaiting Tx block generation)',
      4: 'Pending - Nonce is higher than expected',
      5: 'Pending - Microblock gas limit exceeded',
      6: 'Pending - Consensus failure in network',
    },
    2: {
      3: 'Confirmed',
      10: 'Rejected - Transaction caused math error',
      11: 'Rejected - Scilla invocation error',
      12: 'Rejected - Contract account initialization error',
      13: 'Rejected - Invalid source account',
      14: 'Rejected - Gas limit higher than shard gas limit',
      15: 'Rejected - Unknown transaction type',
      16: 'Rejected - Transaction sent to wrong shard',
      17: 'Rejected - Contract & source account cross-shard issue',
      18: 'Rejected - Code size exceeded limit',
      19: 'Rejected - Transaction verification failed',
      20: 'Rejected - Gas limit too low',
      21: 'Rejected - Insufficient balance',
      22: 'Rejected - Insufficient gas to invoke Scilla checker',
      23: 'Rejected - Duplicate transaction exists',
      24: 'Rejected - Transaction with higher gas price exists',
      25: 'Rejected - Invalid destination address',
      26: 'Rejected - Failed to add contract account to state',
      27: 'Rejected - Nonce is lower than expected',
      255: 'Rejected - Internal error',
    },
  };

  constructor(provider: Provider, signer: Wallet) {
    this.provider = provider;
    this.provider.middleware.request.use(
      util.formatOutgoingTx,
      RPCMethod.CreateTransaction,
    );
    this.signer = signer;
  }

  /**
   * getBlockChainInfo
   *
   * @returns {Promise<RPCResponse<BlockchainInfo, string>>}
   */
  getBlockChainInfo(): Promise<RPCResponse<BlockchainInfo, string>> {
    return this.provider.send(RPCMethod.GetBlockchainInfo);
  }

  /**
   * getShardingStructure
   *
   * @returns {Promise<RPCResponse<ShardingStructure, string>>}
   */
  getShardingStructure(): Promise<RPCResponse<ShardingStructure, string>> {
    return this.provider.send(RPCMethod.GetShardingStructure);
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
    return this.provider.send(RPCMethod.GetDSBlock, blockNum.toString());
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
   * getNumDSBlocks
   *
   * Gets the number of DS blocks that the network has processed.
   *
   * @returns {Promise<RPCResponse<string, string>>}
   */
  getNumDSBlocks(): Promise<RPCResponse<string, string>> {
    return this.provider.send(RPCMethod.GetNumDSBlocks);
  }

  /**
   * getDSBlockRate
   *
   * Gets the average rate of DS blocks processed per second
   *
   * @returns {Promise<RPCResponse<number, string>>}
   */
  getDSBlockRate(): Promise<RPCResponse<number, string>> {
    return this.provider.send(RPCMethod.GetDSBlockRate);
  }

  /**
   * getDSBlockListing
   *
   * Get a paginated list of Directory Service blocks. Pass in page number as
   * parameter. Returns a maxPages variable that specifies the max number of
   * pages. 1 - latest blocks, maxPages - oldest blocks.
   *
   * @param {number} max
   * @returns {Promise<RPCResponse<BlockList, string>>}
   */
  getDSBlockListing(max: number): Promise<RPCResponse<BlockList, string>> {
    return this.provider.send(RPCMethod.DSBlockListing, max);
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
    return this.provider.send(RPCMethod.GetTxBlock, blockNum.toString());
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
   * getNumTxBlocks
   *
   * Gets the total number of TxBlocks.
   *
   * @returns {Promise<RPCResponse<string, string>>}
   */
  getNumTxBlocks(): Promise<RPCResponse<string, string>> {
    return this.provider.send(RPCMethod.GetNumTxBlocks);
  }

  /**
   * getTxBlockRate
   *
   * Gets the average number of Tx blocks per second.
   *
   * @returns {Promise<RPCResponse<number, string>>}
   */
  getTxBlockRate(): Promise<RPCResponse<number, string>> {
    return this.provider.send(RPCMethod.GetTxBlockRate);
  }

  /**
   * getTxBlockListing
   *
   * Get a paginated list of Transaction blocks. Takes a page number as
   * parameter, where each page contains a list of 10 blocks (max). Returns
   * a maxPages variable that specifies the max number of pages. 1 - latest
   * blocks, maxPages - oldest blocks.
   *
   * @param {number} max
   * @returns {Promise<RPCResponse<BlockList, string>>}
   */
  getTxBlockListing(max: number): Promise<RPCResponse<BlockList, string>> {
    return this.provider.send(RPCMethod.TxBlockListing, max);
  }

  /**
   * getNumTransactions
   *
   * Gets the number of transactions processed by the network so far.
   *
   * @returns {Promise<RPCResponse<string, string>>}
   */
  getNumTransactions(): Promise<RPCResponse<string, string>> {
    return this.provider.send(RPCMethod.GetNumTransactions);
  }

  /**
   * getTransactionRate
   *
   * Gets the number of transactions processed per second
   *
   * @returns {Promise<RPCResponse<number, string>>}
   */
  getTransactionRate(): Promise<RPCResponse<number, string>> {
    return this.provider.send(RPCMethod.GetTransactionRate);
  }

  /**
   * getCurrentMiniEpoch
   *
   * Gets the current Tx Epoch.
   *
   * @returns {Promise<RPCResponse<string, string>>}
   */
  getCurrentMiniEpoch(): Promise<RPCResponse<string, string>> {
    return this.provider.send(RPCMethod.GetCurrentMiniEpoch);
  }

  /**
   * getCurrentDSEpoch
   *
   * Gets the current DS Epoch.
   *
   * @returns {Promise<RPCResponse<any, string>>}
   */
  getCurrentDSEpoch(): Promise<RPCResponse<any, string>> {
    return this.provider.send(RPCMethod.GetCurrentDSEpoch);
  }

  /**
   * getPrevDifficulty
   *
   * Gets shard difficulty for previous PoW round
   *
   * @returns {Promise<RPCResponse<number, string>>}
   */
  getPrevDifficulty(): Promise<RPCResponse<number, string>> {
    return this.provider.send(RPCMethod.GetPrevDifficulty);
  }

  /**
   * getPrevDSDifficulty
   *
   * Gets DS difficulty for previous PoW round
   *
   * @returns {Promise<RPCResponse<number, string>>}
   */
  getPrevDSDifficulty(): Promise<RPCResponse<number, string>> {
    return this.provider.send(RPCMethod.GetPrevDSDifficulty);
  }

  /**
   * getTotalCoinSupply
   *
   * Returns the total supply (ZIL) of coins in the network.
   */
  getTotalCoinSupply(): Promise<RPCResponse<string, string>> {
    return this.provider.send(RPCMethod.GetTotalCoinSupply);
  }

  /**
   * getMinerInfo
   *
   * Returns the mining nodes (i.e., the members of the DS committee and shards) at the specified DS block.
   *
   * Notes:
   * 1. Nodes owned by Zilliqa Research are omitted.
   * 2. dscommittee has no size field since the DS committee size is fixed for a given chain.
   * 3. For the Zilliqa Mainnet, this API is only available from DS block 5500 onwards.
   *
   */
  getMinerInfo(dsBlockNumber: string): Promise<RPCResponse<MinerInfo, any>> {
    return this.provider.send(RPCMethod.GetMinerInfo, dsBlockNumber);
  }

  /**
   * createTransaction
   *
   * Creates a transaction and polls the lookup node for a transaction
   * receipt. The transaction is considered to be lost if it is not confirmed
   * within the timeout period.
   *
   * @param {Transaction} tx
   * @param {number} maxAttempts - (optional) number of times to poll before timing out
   * @param {number} number - (optional) interval in ms
   * @returns {Promise<Transaction>} - the Transaction that has been signed and
   * broadcasted to the network.
   */
  @sign
  async createTransaction(
    tx: Transaction,
    maxAttempts: number = GET_TX_ATTEMPTS,
    interval: number = 1000,
    blockConfirm: boolean = false,
  ): Promise<Transaction> {
    try {
      const response = await this.provider.send(RPCMethod.CreateTransaction, {
        ...tx.txParams,
        priority: tx.toDS,
      });

      if (response.error) {
        throw response.error;
      }
      if (blockConfirm) {
        return tx.blockConfirm(response.result.TranID, maxAttempts, interval);
      }
      return tx.confirm(response.result.TranID, maxAttempts, interval);
    } catch (err) {
      throw err;
    }
  }

  // used together with signed batch
  // this method waits for each txn to confirm
  // see @createBatchTransactionWithoutConfirm for transactions without confirmation
  async createBatchTransaction(
    signedTxList: Transaction[],
    maxAttempts: number = GET_TX_ATTEMPTS,
    interval: number = 1000,
    blockConfirm: boolean = false,
  ): Promise<Transaction[]> {
    try {
      const txParamsList = [];
      for (const signedTx of signedTxList) {
        if (signedTx.txParams.signature === undefined) {
          throw new Error('The transaction is not signed.');
        }
        txParamsList.push({
          ...signedTx.txParams,
          priority: signedTx.toDS,
        });
      }

      const response = await this.provider.sendBatch(
        RPCMethod.CreateTransaction,
        txParamsList,
      );

      if (response.error) {
        throw response.error;
      }

      // retrieve batch result
      const batchResults = [];
      for (let i = 0; i < signedTxList.length; i++) {
        const tx = signedTxList[i];
        const txRes = response.batch_result[i];

        if (blockConfirm) {
          batchResults.push(
            await tx.blockConfirm(txRes.result.TranID, maxAttempts, interval),
          );
        } else {
          batchResults.push(
            await tx.confirm(txRes.result.TranID, maxAttempts, interval),
          );
        }
      }
      return batchResults;
    } catch (err) {
      throw err;
    }
  }

  /**
   * createTransactionRaw
   *
   * Create a transaction by using a exist signed transaction payload
   * This payload may come form some offline signing software like ledger
   * Currently we haven't supported convert a singed transaction back to transaction param, so we won't perform
   * confirm logic here, but there is another convenient way to do so, can refer examples/createTransactionRaw.js
   *
   * @param payload
   */
  async createTransactionRaw(payload: string): Promise<string> {
    try {
      const tx = JSON.parse(payload);
      const response = await this.provider.send(
        RPCMethod.CreateTransaction,
        tx,
      );
      if (response.error) {
        throw response.error;
      }
      return response.result.TranID;
    } catch (err) {
      throw err;
    }
  }

  @sign
  async createTransactionWithoutConfirm(tx: Transaction): Promise<Transaction> {
    try {
      const response = await this.provider.send(RPCMethod.CreateTransaction, {
        ...tx.txParams,
        priority: tx.toDS,
      });
      if (response.error) {
        throw response.error;
      }
      tx.id = response.result.TranID;
      return tx;
    } catch (err) {
      throw err;
    }
  }

  // used together with signed batch
  async createBatchTransactionWithoutConfirm(
    signedTxList: Transaction[],
  ): Promise<Transaction[]> {
    try {
      const txParamsList = [];
      for (const signedTx of signedTxList) {
        if (signedTx.txParams.signature === undefined) {
          throw new Error('The transaction is not signed.');
        }
        txParamsList.push({
          ...signedTx.txParams,
          priority: signedTx.toDS,
        });
      }

      const response = await this.provider.sendBatch(
        RPCMethod.CreateTransaction,
        txParamsList,
      );

      if (response.error) {
        throw response.error;
      }

      const batchResults = [];
      for (let i = 0; i < signedTxList.length; i++) {
        const tx = signedTxList[i];
        const txRes = response.batch_result[i];
        tx.id = txRes.result.TranID;
        batchResults.push(tx);
      }
      return batchResults;
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
   * @returns {Promise<Transaction>}
   */
  async getTransaction(txHash: string): Promise<Transaction> {
    try {
      const response = await this.provider.send<TransactionObj>(
        RPCMethod.GetTransaction,
        txHash,
      );

      if (response.error) {
        return Promise.reject(response.error);
      }

      return response.result.receipt.success
        ? Transaction.confirm(toTxParams(response), this.provider)
        : Transaction.reject(toTxParams(response), this.provider);
    } catch (err) {
      throw err;
    }
  }

  /**
   * Returns the status of a specified transaction.
   * This API is available from Zilliqa `V7.0.0` onwards and supports all transaction statuses
   * (unconfirmed, confirmed, and rejected).
   *
   * @param txHash
   * @returns {Promise<TransactionStatusObj>}
   */
  async getTransactionStatus(txHash: string): Promise<TransactionStatusObj> {
    try {
      const response = await this.provider.send<TransactionStatusObj>(
        RPCMethod.GetTransactionStatus,
        txHash,
      );
      if (response.error) {
        return Promise.reject(response.error);
      }

      const modificationState = response.result.modificationState;
      const status = response.result.status;
      response.result.statusMessage = this.transactionStatusMap[
        modificationState
      ][status];
      return response.result;
    } catch (err) {
      throw err;
    }
  }

  /**
   * getRecentTransactions
   *
   * Gets a list of recent transactions
   *
   * @returns {Promise<RPCResponse<TxList, never>>}
   */
  getRecentTransactions(): Promise<RPCResponse<TxList, never>> {
    return this.provider.send(RPCMethod.GetRecentTransactions);
  }

  /**
   * getTransactionsForTxBlock
   *
   * Gets all transactions for a given TxBlock, grouped by shard id
   *
   * @param {number} txBlock
   * @returns {Promise<RPCResponse<string[][], string>>}
   */
  getTransactionsForTxBlock(
    txBlock: number,
  ): Promise<RPCResponse<string[][], string>> {
    return this.provider.send(
      RPCMethod.GetTransactionsForTxBlock,
      txBlock.toString(),
    );
  }

  /**
   * getTxnBodiesForTxBlock
   *
   * @param {number} txBlock
   * @returns { romise<RPCResponse<TransactionObj[], string>>}
   */
  getTxnBodiesForTxBlock(
    txBlock: number,
  ): Promise<RPCResponse<TransactionObj[], string>> {
    return this.provider.send(
      RPCMethod.GetTxnBodiesForTxBlock,
      txBlock.toString(),
    );
  }

  /**
   * getNumTxnsTxEpoch
   *
   * Gets the number of transactions procesed for a given Tx Epoch.
   *
   * @param {number} epoch
   * @returns {Promise<RPCResponse<number, never>>}
   */
  getNumTxnsTxEpoch(epoch: number): Promise<RPCResponse<string, string>> {
    return this.provider.send(RPCMethod.GetNumTxnsTxEpoch, epoch);
  }

  /**
   * getNumTxnsDSEpoch
   *
   * Gets the number of transactions procesed for a given DS Epoch.
   *
   * @param {number} epoch
   * @returns {Promise<any>}
   */
  getNumTxnsDSEpoch(epoch: number): Promise<RPCResponse<string, string>> {
    return this.provider.send(RPCMethod.GetNumTxnsDSEpoch, epoch);
  }

  /**
   * getMinimumGasPrice
   *
   * Gets the numeric minimum gas price
   *
   * @returns {Promise<RPCResponse<string, string>>}
   */
  getMinimumGasPrice() {
    return this.provider.send<string, string>(RPCMethod.GetMinimumGasPrice);
  }

  /**
   * getBalance
   *
   * Gets the balance of an account by address
   *
   * @param {string} address
   * @returns {Promise<RPCResponse<any, string>>}
   */
  getBalance(addr: string): Promise<RPCResponse<any, string>> {
    const address = validation.isBech32(addr) ? fromBech32Address(addr) : addr;
    return this.provider.send(
      RPCMethod.GetBalance,
      address.replace('0x', '').toLowerCase(),
    );
  }

  /**
   * getSmartContractCode - returns the smart contract code of a deployed contract.
   *
   * @param {string} address
   * @returns {Promise<RPCResponse<{code: string }, string>>}
   */
  getSmartContractCode(
    addr: string,
  ): Promise<RPCResponse<{ code: string }, string>> {
    const address = validation.isBech32(addr) ? fromBech32Address(addr) : addr;
    return this.provider.send(
      RPCMethod.GetSmartContractCode,
      address.replace('0x', '').toLowerCase(),
    );
  }

  /**
   * getSmartContractInit
   *
   * @param {string} address
   * @returns {Promise<RPCResponse<Value[], string>>}
   */
  getSmartContractInit(addr: string): Promise<RPCResponse<Value[], string>> {
    const address = validation.isBech32(addr) ? fromBech32Address(addr) : addr;
    return this.provider.send(
      RPCMethod.GetSmartContractInit,
      address.replace('0x', '').toLowerCase(),
    );
  }

  /**
   * getSmartContractState - retrieves the entire state of a smart contract
   *
   * @param {string} address
   * @returns {Promise<RPCResponse<any, string>>}
   */
  getSmartContractState(addr: string): Promise<RPCResponse<any, string>> {
    const address = validation.isBech32(addr) ? fromBech32Address(addr) : addr;
    return this.provider.send(
      RPCMethod.GetSmartContractState,
      address.replace('0x', '').toLowerCase(),
    );
  }

  /**
   * getSmartContractSubState - Queries the contract state, filtered by the variable names.
   * This function is the filtered version of `getSmartContractState`.
   * As `getSubState` performs the filtering, `variableName` of a field is required.
   * If the `subState` is not found, this returns a `null` response.
   *
   * @param {string} address
   * @param { string } variableName - variable name within the state
   * @param { string[] } indices - (optional) If the variable is of map type, you can specify an index (or indices)
   * @returns {Promise<RPCResponse<any, string>>}
   */

  getSmartContractSubState(
    addr: string,
    variableName: string,
    indices?: string[],
  ): Promise<RPCResponse<any, string>> {
    const address = validation.isBech32(addr) ? fromBech32Address(addr) : addr;
    if (!variableName) {
      throw new Error('Variable name required');
    }

    return this.provider.send(
      RPCMethod.GetSmartContractSubState,
      address.replace('0x', '').toLowerCase(),
      variableName,
      indices === undefined ? [] : indices,
    );
  }

  /**
   * getSmartContractSubStateBatch - Quires the contract state using batch rpc.
   * @param reqs array of address variableName indices
   *  e.g ["5938fc8af82250ad6cf1da3bb92f4aa005cb2717","balances",['0x381f4008505e940ad7681ec3468a719060caf796']]
   * @returns
   */
  getSmartContractSubStateBatch(reqs: any[]): Promise<RPCResponse<any, any>> {
    return this.provider.sendBatch(RPCMethod.GetSmartContractSubState, reqs);
  }

  /**
   * getSmartContracts
   *
   * @param {string} address
   * @returns {Promise<RPCResponse<ContractObj[], string>>}
   */
  getSmartContracts(addr: string): Promise<RPCResponse<ContractObj[], string>> {
    const address = validation.isBech32(addr) ? fromBech32Address(addr) : addr;
    return this.provider.send(
      RPCMethod.GetSmartContracts,
      address.replace('0x', '').toLowerCase(),
    );
  }

  /**
   * getContractAddressFromTransactionID
   *
   * @param {string} txHash
   * @returns {Promise<RPCResponse<string, string>>}
   */
  getContractAddressFromTransactionID(
    txHash: string,
  ): Promise<RPCResponse<string, string>> {
    return this.provider.send(
      RPCMethod.GetContractAddressFromTransactionID,
      txHash,
    );
  }
}
