import BN from 'bn.js';
import {Provider, RPCResponse, Signable} from 'zilliqa-js-core';

import {TxParams, TxStatus} from './types';
import {encodeTransaction} from './util';

/**
 * Transaction
 *
 * Transaction is a functor. Its purpose is to encode the possible states a
 * Transaction can be in:  Confirmed, Rejected, Pending, or Initialised (i.e., not broadcasted).
 */
export default class Transaction implements Signable {
  /**
   * confirmed
   *
   * constructs an already-confirmed transaction.
   *
   * @static
   * @param {BaseTx} params
   */
  static confirm(params: TxParams) {
    return new Transaction(params, TxStatus.Confirmed);
  }

  static provider: Provider;

  static setProvider(provider: Provider) {
    Transaction.provider = provider;
  }
  // parameters
  version: number;
  to: string;
  amount: BN;
  gasPrice: number;
  gasLimit: number;
  id?: string;
  code?: string;
  data?: string;
  receipt?: {success: boolean; cumulative_gas: number};
  nonce?: number;
  pubKey?: string;
  signature?: string;

  // internal state
  status: TxStatus;

  get bytes(): Buffer {
    return encodeTransaction(this.txParams);
  }

  get txParams(): TxParams {
    return {
      version: 0,
      id: this.id,
      to: this.to,
      nonce: this.nonce,
      pubKey: this.pubKey,
      amount: this.amount,
      gasPrice: this.gasPrice,
      gasLimit: this.gasLimit,
      code: this.code,
      data: this.data,
      signature: this.signature,
      receipt: this.receipt,
    };
  }

  constructor(params: TxParams, status: TxStatus = TxStatus.Initialised) {
    this.version = params.version;
    this.id = params.id;
    this.to = params.to;
    this.nonce = params.nonce;
    this.pubKey = params.pubKey;
    this.amount = params.amount;
    this.code = params.code;
    this.data = params.data;
    this.signature = params.signature;
    this.gasPrice = params.gasPrice;
    this.gasLimit = params.gasLimit;
    this.receipt = params.receipt;

    this.status = status;
  }

  /**
   * isPending
   *
   * @returns {boolean}
   */
  isPending(): boolean {
    return this.status === TxStatus.Pending;
  }

  /**
   * isInitialised
   *
   * @returns {boolean}
   */
  isInitialised(): boolean {
    return this.status === TxStatus.Initialised;
  }

  /**
   * isConfirmed
   *
   * @returns {boolean}
   */
  isConfirmed(): boolean {
    return this.status === TxStatus.Confirmed;
  }

  /**
   * isRejected
   *
   * @returns {boolean}
   */
  isRejected(): boolean {
    return this.status === TxStatus.Rejected;
  }

  /**
   * confirmReceipt
   *
   * Similar to the Promise API. This sets the Transaction instance to a state
   * of pending. Calling this function kicks off a passive loop that polls the
   * lookup node for confirmation on the txHash.
   *
   * This is a low-level method that you should generally not have to use
   * directly.
   *
   * @param {string} txHash
   * @param {number} timeout
   * @returns {Promise<Transaction>}
   */
  confirm(txHash: string, timeout: number = 60000): Promise<Transaction> {
    this.status = TxStatus.Pending;

    return new Promise((resolve, reject) => {
      const token = setTimeout(() => {
        this.status = TxStatus.Rejected;
        reject(
          new Error(
            'The transaction is taking unusually long to be confirmed. It may be lost.',
          ),
        );
      }, timeout);

      const cancelTimeout = () => {
        clearTimeout(token);
      };

      this.trackTx(txHash, resolve, reject, cancelTimeout);
    });
  }

  map(fn: (prev: TxParams) => TxParams): Transaction {
    const newParams = fn(this.txParams);
    this.setParams(newParams);

    return this;
  }

  private setParams(params: TxParams) {
    this.version = params.version;
    this.id = params.id;
    this.to = params.to;
    this.nonce = params.nonce;
    this.pubKey = params.pubKey;
    this.amount = params.amount;
    this.code = params.code;
    this.data = params.data;
    this.signature = params.signature;
    this.gasPrice = params.gasPrice;
    this.gasLimit = params.gasLimit;
    this.receipt = params.receipt;
  }

  private trackTx(
    txHash: string,
    resolve: (self: Transaction) => void,
    reject: (err: any) => void,
    cancelTimeout: () => void,
  ) {
    if (this.isRejected()) {
      return;
    }

    // TODO: regex validation for txHash so we don't get garbage
    const result = Transaction.provider.send('GetTransaction', [txHash]);

    result
      .then((res: RPCResponse) => {
        if (res.result && res.result.error) {
          this.trackTx(txHash, resolve, reject, cancelTimeout);
          return;
        }

        if (res.result) {
          this.id = res.result['ID'];
          this.receipt = res.result.receipt;
          this.status =
            this.receipt && this.receipt.success
              ? TxStatus.Confirmed
              : TxStatus.Rejected;
          cancelTimeout();
          resolve(this);
        }
      })
      .catch(err => {
        cancelTimeout();
        this.status = TxStatus.Rejected;
        reject(err);
      });
  }
}
