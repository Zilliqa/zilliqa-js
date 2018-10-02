import {Provider, ZilliqaModule} from 'zilliqa-js-core';
import {Wallet} from 'zilliqa-js-account';
import {TransactionObj} from './types';

const enum BlockchainMethods {
  GetDSBlock = 'GetDSBlock',
  GetLatestDSBlock = 'GetLatestDsBlock',
  GetTxBlock = 'GetTSBlock',
  GetLatestTxBlock = 'GetLatestTxBlock',
  CreateTransaction = 'CreateTransaction',
  GetTransaction = 'GetTransaction',
}

export default class Blockchain implements ZilliqaModule {
  signer: Wallet;
  provider: Provider;

  constructor(provider: Provider, signer: Wallet) {
    this.provider = provider;
    this.signer = signer;
  }

  getDSBlock(blockNum: number): Promise<any> {
    return this.provider.send(BlockchainMethods.GetDSBlock, {});
  }

  getLatestDSBlock(): Promise<any> {
    return this.provider.send(BlockchainMethods.GetLatestTxBlock, {});
  }

  getTxBlock(blockNum: number): Promise<any> {
    return this.provider.send(BlockchainMethods.GetTxBlock, {});
  }

  getLatestTxBlock(): Promise<any> {
    return this.provider.send(BlockchainMethods.GetLatestTxBlock, {});
  }

  /**
   * createTransaction
   *
   * Creates a transaction and polls the lookup node for a transaction
   * receipt. If, within the timeout, no transaction is found, the transaction
   * is considered as lost.
   *
   * @param {any} payload
   * @returns {Promise<any>}
   */
  createTransaction(payload: any): Promise<any> {
    return this.provider.send(BlockchainMethods.CreateTransaction, payload);
  }

  /**
   * getTransaction
   *
   * @param {string} txHash
   * @returns {Promise<any>}
   */
  getTransaction(txHash: string): Promise<any> {
    return this.provider.send(BlockchainMethods.GetTransaction);
  }
}
