import {Provider, ZilliqaModule, sign, RPCResponse} from 'zilliqa-js-core';
import {Transaction, Wallet} from 'zilliqa-js-account';

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
   * @param {Transaction} payload
   * @returns {Promise<RPCResponse>}
   */
  @sign
  createTransaction(tx: Transaction): Promise<RPCResponse> {
    const raw = tx.return();
    return this.provider.send(BlockchainMethods.CreateTransaction, [
      {...raw, amount: raw.amount.toNumber()},
    ]);
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
