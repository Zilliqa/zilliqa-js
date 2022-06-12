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

import { Transaction, util, Wallet } from '@zilliqa-js/account';
import { fromBech32Address } from '@zilliqa-js/crypto';
import { validation } from '@zilliqa-js/util';
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

const isBlockNumber = (blockNum: number) =>
  Number.isFinite(blockNum) && Number.isInteger(blockNum) && blockNum >= 0;

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

  getBlockChainInfo(): Promise<RPCResponse<BlockchainInfo, string>> {
    return this.provider.send(RPCMethod.GetBlockchainInfo);
  }

  getShardingStructure(): Promise<RPCResponse<ShardingStructure, string>> {
    return this.provider.send(RPCMethod.GetShardingStructure);
  }

  // Gets details of a Directory Service block by block number.
  getDSBlock(blockNum: number): Promise<RPCResponse<DsBlockObj, string>> {
    return this.provider.send(RPCMethod.GetDSBlock, blockNum.toString());
  }

  // Gets details of the most recent Directory Service block.
  getLatestDSBlock(): Promise<RPCResponse<DsBlockObj, string>> {
    return this.provider.send(RPCMethod.GetLatestDSBlock);
  }

  // Gets the number of DS blocks that the network has processed.
  getNumDSBlocks(): Promise<RPCResponse<string, string>> {
    return this.provider.send(RPCMethod.GetNumDSBlocks);
  }

  // Gets the average rate of DS blocks processed per second
  getDSBlockRate(): Promise<RPCResponse<number, string>> {
    return this.provider.send(RPCMethod.GetDSBlockRate);
  }

  // Gets a paginated list of up to 10 Directory Service (DS) blocks
  // and their block hashes for a specified page.
  getDSBlockListing(max: number): Promise<RPCResponse<BlockList, string>> {
    return this.provider.send(RPCMethod.DSBlockListing, max);
  }

  // Gets details of a Transaction block by block number.
  getTxBlock(blockNum: number): Promise<RPCResponse<TxBlockObj, string>> {
    return this.provider.send(RPCMethod.GetTxBlock, blockNum.toString());
  }

  // Gets details of the most recent Transaction block.
  getLatestTxBlock(): Promise<RPCResponse<TxBlockObj, string>> {
    return this.provider.send(RPCMethod.GetLatestTxBlock);
  }

  // Gets the total number of TxBlocks.
  getNumTxBlocks(): Promise<RPCResponse<string, string>> {
    return this.provider.send(RPCMethod.GetNumTxBlocks);
  }

  // Gets the average number of Tx blocks per second.
  getTxBlockRate(): Promise<RPCResponse<number, string>> {
    return this.provider.send(RPCMethod.GetTxBlockRate);
  }

  // Get a paginated list of Transaction blocks.
  getTxBlockListing(max: number): Promise<RPCResponse<BlockList, string>> {
    return this.provider.send(RPCMethod.TxBlockListing, max);
  }

  // Gets the number of transactions processed by the network so far.
  getNumTransactions(): Promise<RPCResponse<string, string>> {
    return this.provider.send(RPCMethod.GetNumTransactions);
  }

  // Gets the number of transactions processed per second
  getTransactionRate(): Promise<RPCResponse<number, string>> {
    return this.provider.send(RPCMethod.GetTransactionRate);
  }

  // Gets the current Tx Epoch.
  getCurrentMiniEpoch(): Promise<RPCResponse<string, string>> {
    return this.provider.send(RPCMethod.GetCurrentMiniEpoch);
  }

  // Gets the current DS Epoch.
  getCurrentDSEpoch(): Promise<RPCResponse<any, string>> {
    return this.provider.send(RPCMethod.GetCurrentDSEpoch);
  }

  // Gets shard difficulty for previous PoW round
  getPrevDifficulty(): Promise<RPCResponse<number, string>> {
    return this.provider.send(RPCMethod.GetPrevDifficulty);
  }

  // Gets DS difficulty for previous PoW round
  getPrevDSDifficulty(): Promise<RPCResponse<number, string>> {
    return this.provider.send(RPCMethod.GetPrevDSDifficulty);
  }

  // Returns the total supply (ZIL) of coins in the network.
  getTotalCoinSupply(): Promise<RPCResponse<string, string>> {
    return this.provider.send(RPCMethod.GetTotalCoinSupply);
  }

  // Returns the mining nodes (i.e., the members of the DS committee and shards)
  // at the specified DS block.
  getMinerInfo(dsBlockNumber: string): Promise<RPCResponse<MinerInfo, any>> {
    return this.provider.send(RPCMethod.GetMinerInfo, dsBlockNumber);
  }

  // Creates a transaction and polls the lookup node for a transaction receipt.
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

  // Create a transaction by using a exist signed transaction payload
  // This payload may come form some offline signing software like ledger
  // Currently we haven't supported convert a singed transaction back to transaction param, so we won't perform
  // confirm logic here.
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

  // Returns the details of a specified Transaction.
  async getTransaction(txHash: string): Promise<Transaction> {
    try {
      const response = await this.provider.send<TransactionObj>(
        RPCMethod.GetTransaction,
        txHash.replace('0x', ''),
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

  // Returns the status of a specified transaction.
  async getTransactionStatus(txHash: string): Promise<TransactionStatusObj> {
    try {
      const response = await this.provider.send<TransactionStatusObj>(
        RPCMethod.GetTransactionStatus,
        txHash.replace('0x', ''),
      );
      if (response.error) {
        return Promise.reject(response.error);
      }

      const modificationState = response.result.modificationState;
      const status = response.result.status;
      response.result.statusMessage =
        this.transactionStatusMap[modificationState][status];
      return response.result;
    } catch (err) {
      throw err;
    }
  }

  // Gets a list of recent transactions
  getRecentTransactions(): Promise<RPCResponse<TxList, never>> {
    return this.provider.send(RPCMethod.GetRecentTransactions);
  }

  // Returns the validated transactions included
  // within a specified final transaction block as an array of
  // length i, where i is the number of shards plus the DS committee.
  getTransactionsForTxBlock(
    txBlock: number,
  ): Promise<RPCResponse<string[][], string>> {
    return this.provider.send(
      RPCMethod.GetTransactionsForTxBlock,
      txBlock.toString(),
    );
  }

  // returns the transactions in batches (or pages) of 2,500.
  // This API behaves similar to GetTransactionsForTxBlock
  getTransactionsForTxBlockEx(
    txBlock: number,
  ): Promise<RPCResponse<any, string>> {
    if (!isBlockNumber(txBlock)) {
      throw new Error('invalid txBlock');
    }
    return this.provider.send(
      RPCMethod.GetTransactionsForTxBlockEx,
      txBlock.toString(),
    );
  }

  // Returns the validated transactions (in verbose form)
  // included within a specified final transaction block.
  getTxnBodiesForTxBlock(
    txBlock: number,
  ): Promise<RPCResponse<TransactionObj[], string>> {
    return this.provider.send(
      RPCMethod.GetTxnBodiesForTxBlock,
      txBlock.toString(),
    );
  }

  // Returns the transactions in batches (or pages) of 2,500
  // This API behaves similar to GetTxBodiesForTxBlock
  getTxnBodiesForTxBlockEx(txBlock: number): Promise<RPCResponse<any, string>> {
    if (!isBlockNumber(txBlock)) {
      throw new Error('invalid txBlock');
    }
    return this.provider.send(
      RPCMethod.GetTxnBodiesForTxBlockEx,
      txBlock.toString(),
    );
  }

  // Gets the number of transactions procesed for a given Tx Epoch.
  getNumTxnsTxEpoch(epoch: number): Promise<RPCResponse<string, string>> {
    return this.provider.send(RPCMethod.GetNumTxnsTxEpoch, epoch);
  }

  // Gets the number of transactions procesed for a given DS Epoch.
  getNumTxnsDSEpoch(epoch: number): Promise<RPCResponse<string, string>> {
    return this.provider.send(RPCMethod.GetNumTxnsDSEpoch, epoch);
  }

  // Gets the numeric minimum gas price.
  getMinimumGasPrice() {
    return this.provider.send<string, string>(RPCMethod.GetMinimumGasPrice);
  }

  // Gets the balance of an account by address.
  getBalance(addr: string): Promise<RPCResponse<any, string>> {
    const address = validation.isBech32(addr) ? fromBech32Address(addr) : addr;
    return this.provider.send(
      RPCMethod.GetBalance,
      address.replace('0x', '').toLowerCase(),
    );
  }

  // Returns the Scilla code associated with a smart contract address
  getSmartContractCode(
    addr: string,
  ): Promise<RPCResponse<{ code: string }, string>> {
    const address = validation.isBech32(addr) ? fromBech32Address(addr) : addr;
    return this.provider.send(
      RPCMethod.GetSmartContractCode,
      address.replace('0x', '').toLowerCase(),
    );
  }

  // Returns the initialization (immutable) parameters of
  // a given smart contract, represented in a JSON format.
  getSmartContractInit(addr: string): Promise<RPCResponse<any, string>> {
    const address = validation.isBech32(addr) ? fromBech32Address(addr) : addr;
    return this.provider.send(
      RPCMethod.GetSmartContractInit,
      address.replace('0x', '').toLowerCase(),
    );
  }

  // Retrieves the entire state of a smart contract.
  getSmartContractState(addr: string): Promise<RPCResponse<any, string>> {
    const address = validation.isBech32(addr) ? fromBech32Address(addr) : addr;
    return this.provider.send(
      RPCMethod.GetSmartContractState,
      address.replace('0x', '').toLowerCase(),
    );
  }

  // Queries the contract state, filtered by the variable names.
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

  // Queries the contract state using batch rpc.
  getSmartContractSubStateBatch(reqs: any[]): Promise<RPCResponse<any, any>> {
    return this.provider.sendBatch(RPCMethod.GetSmartContractSubState, reqs);
  }

  getSmartContracts(addr: string): Promise<RPCResponse<any, string>> {
    const address = validation.isBech32(addr) ? fromBech32Address(addr) : addr;
    return this.provider.send(
      RPCMethod.GetSmartContracts,
      address.replace('0x', '').toLowerCase(),
    );
  }

  getContractAddressFromTransactionID(
    txHash: string,
  ): Promise<RPCResponse<string, string>> {
    return this.provider.send(
      RPCMethod.GetContractAddressFromTransactionID,
      txHash,
    );
  }

  // Returns the state proof for the corresponding TxBlock for a smart contract.
  getStateProof(
    contractAddress: string,
    sha256Hash: string,
    txBlock: number | string,
  ): Promise<RPCResponse<any, string>> {
    const address = validation.isBech32(contractAddress)
      ? fromBech32Address(contractAddress)
      : contractAddress;

    const isLatestStr = txBlock === 'latest';
    const isValid = isLatestStr || isBlockNumber(Number(txBlock));
    if (!isValid) {
      throw new Error('invalid txBlock');
    }

    return this.provider.send(
      RPCMethod.GetStateProof,
      address.replace('0x', '').toLowerCase(),
      sha256Hash,
      txBlock.toString(),
    );
  }
}
