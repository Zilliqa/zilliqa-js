import axios from 'axios';
import BN from 'bn.js';

import {Provider, RPCResponse} from 'zilliqa-js-core';

import {TxParams, TxStatus} from './types';
import {encodeTransaction} from './util';

/**
 * Transaction
 *
 * Transaction is a monad-like class. Its purpose
 * is to encode the possible states a Transaction can be in:  Confirmed,
 * Rejected, Pending, or Initialised (i.e., not broadcasted).
 */
export default class Transaction {
  /**
   * confirmed
   *
   * constructs an already-confirmed transaction.
   *
   * @static
   * @param {TxParams} params
   * @returns {undefined}
   */
  static confirmed(params: TxParams) {
    return new Transaction({...params, status: TxStatus.Confirmed});
  }

  /**
   * at
   *
   * Convenience method that constructs a requested transaction if it exists.
   *
   * @static
   * @param {string} txHash
   * @returns {undefined}
   */
  static at(txHash: string): Promise<Transaction> {
    return Transaction.provider.send('GetTransaction', txHash).then(res => {
      if (res.error) {
        throw new Error(res.error.message);
      }

      return Transaction.confirmed(res.result);
    });
  }

  static provider: Provider;

  static setProvider(provider: Provider) {
    Transaction.provider = provider;
  }

  private params: TxParams;
  private provider: Provider;
  private request: Promise<RPCResponse> | undefined;

  get bytes(): Buffer {
    return encodeTransaction(this);
  }

  constructor(params: TxParams) {
    this.params = params;
    this.provider = Transaction.provider;
  }

  /**
   * isPending
   *
   * @returns {boolean}
   */
  isPending(): boolean {
    return this.params.status === TxStatus.Pending;
  }

  /**
   * isInitialised
   *
   * @returns {boolean}
   */
  isInitialised(): boolean {
    return this.params.status === TxStatus.Initialised;
  }

  /**
   * isConfirmed
   *
   * @returns {boolean}
   */
  isConfirmed(): boolean {
    return this.params.status === TxStatus.Confirmed;
  }

  /**
   * isRejected
   *
   * @returns {boolean}
   */
  isRejected(): boolean {
    return this.params.status === TxStatus.Rejected;
  }

  /**
   * broadcast
   *
   * @returns {Transaction}
   */
  broadcast(): Transaction {
    if (!this.params.signature) {
      throw new Error(
        'Cannot broadcast a transaction that has not been signed.',
      );
    }

    this.provider.send('CreateTransaction', this.params).then(res => {
      if (res.error) {
        this.params.status = TxStatus.Rejected;
        return;
      }

      this.request = this.provider.send(
        'GetTransaction',
        this.pollTxConfirmation,
      );

      this.params.status = TxStatus.Pending;
    });

    return this;
  }

  /**
   * bind
   *
   * only runs if TxStatus is Confirmed.
   *
   * @param {(tx: TxParams) => Transaction} fn
   * @returns {Transaction}
   */
  bind(fn: (tx: TxParams) => Transaction): Transaction {
    return this.isConfirmed() ? fn(this.params) : this;
  }

  /**
   * map
   *
   * @param {(tx: TxParams) => TxParams} fn
   * @returns {Transaction}
   */
  map(fn: (tx: TxParams) => TxParams): Transaction {
    return this.isConfirmed() ? Transaction.confirmed(fn(this.params)) : this;
  }

  /**
   * return
   *
   * Gives back the unboxed parameters
   *
   * @returns {TxParams}
   */
  return(): TxParams {
    return this.params;
  }

  private pollTxConfirmation(response: RPCResponse) {
    if (response.error) {
      setTimeout(() => {
        this.request = this.provider.send(
          'GetTransaction',
          this.pollTxConfirmation,
        );
      }, 1000);

      return;
    }

    this.request = undefined;
    this.params.status = TxStatus.Confirmed;
  }
}
