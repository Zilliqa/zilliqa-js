import BN from 'bn.js';

import {Provider, RPCResponse, Signable} from '@zilliqa/zilliqa-js-core';
import {getAddressFromPublicKey} from '@zilliqa/zilliqa-js-crypto';
import {types} from '@zilliqa/zilliqa-js-util';

import {TxParams, TxReceipt, TxStatus, TxIncluded} from './types';
import {encodeTransaction} from './util';

/**
 * Transaction
 *
 * Transaction is a functor. Its purpose is to encode the possible states a
 * Transaction can be in:  Confirmed, Rejected, Pending, or Initialised (i.e., not broadcasted).
 */
export default class Transaction implements Signable {
  /**
   * confirm
   *
   * constructs an already-confirmed transaction.
   *
   * @static
   * @param {BaseTx} params
   */
  static confirm(params: TxParams, provider: Provider) {
    return new Transaction(params, provider, TxStatus.Confirmed);
  }

  /**
   * reject
   *
   * constructs an already-rejected transaction.
   *
   * @static
   * @param {BaseTx} params
   */
  static reject(params: TxParams, provider: Provider) {
    return new Transaction(params, provider, TxStatus.Rejected);
  }

  provider: Provider;

  // parameters
  private version: number;
  private to: string;
  private amount: BN;
  private gasPrice: BN;
  private gasLimit: BN;
  private id?: string;
  private code: string;
  private data: string;
  private receipt?: TxReceipt;
  private nonce?: number;
  private pubKey?: string;
  private signature?: string;

  // internal state
  status: TxStatus;

  get bytes(): Buffer {
    return encodeTransaction(this.txParams);
  }

  get senderAddress(): string {
    if (!this.pubKey) {
      return '0'.repeat(40);
    }

    return getAddressFromPublicKey(this.pubKey);
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

  get payload() {
    return {
      version: 1,
      id: this.id,
      to: this.to,
      nonce: this.nonce,
      pubKey: this.pubKey,
      amount: this.amount.toNumber(),
      gasPrice: this.gasPrice.toNumber(),
      gasLimit: this.gasLimit.toNumber(),
      code: this.code,
      data: this.data,
      signature: this.signature,
      receipt: this.receipt,
    };
  }

  constructor(
    params: TxParams,
    provider: Provider,
    status: TxStatus = TxStatus.Initialised,
  ) {
    // private members
    this.version = params.version;
    this.id = params.id;
    this.to = params.to;
    this.nonce = params.nonce;
    this.pubKey = params.pubKey;
    this.amount = params.amount;
    this.code = params.code || '';
    this.data = params.data || '';
    this.signature = params.signature;
    this.gasPrice = params.gasPrice;
    this.gasLimit = params.gasLimit;
    this.receipt = params.receipt;

    // public members
    this.provider = provider;
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
   * setProvider
   *
   * Sets the provider on this instance.
   *
   * @param {Provider} provider
   */
  setProvider(provider: Provider) {
    this.provider = provider;
  }

  /**
   * setStatus
   *
   * Escape hatch to imperatively set the state of the transaction.
   *
   * @param {TxStatus} status
   * @returns {undefined}
   */
  setStatus(status: TxStatus) {
    this.status = status;
    return this;
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
  confirm(txHash: string, timeout: number = 120000): Promise<Transaction> {
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

  /**
   * map
   *
   * maps over the transaction, allowing for manipulation.
   *
   * @param {(prev: TxParams) => TxParams} fn - mapper
   * @returns {Transaction}
   */
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
    this.code = params.code || '';
    this.data = params.data || '';
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
    const result = this.provider.send('GetTransaction', txHash);

    result
      .then((res: RPCResponse<TxIncluded, string>) => {
        if (types.isError(res)) {
          this.trackTx(txHash, resolve, reject, cancelTimeout);
          return;
        } else {
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
