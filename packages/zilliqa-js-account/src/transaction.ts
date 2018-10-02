import {Provider, RPCResponse, Signable} from 'zilliqa-js-core';

import {RawTx, TxStatus} from './types';
import {encodeTransaction} from './util';

/**
 * Transaction
 *
 * Transaction is a monad-like class. Its purpose
 * is to encode the possible states a Transaction can be in:  Confirmed,
 * Rejected, Pending, or Initialised (i.e., not broadcasted).
 */
export default class Transaction implements Signable {
  /**
   * confirmed
   *
   * constructs an already-confirmed transaction.
   *
   * @static
   * @param {RawTx} params
   */
  static confirmed(params: RawTx) {
    return new Transaction(params, TxStatus.Confirmed);
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

  private rawTx: RawTx;
  private provider: Provider;
  private request: Promise<RPCResponse> | undefined;
  signature: string = '';
  status: TxStatus;

  get bytes(): Buffer {
    return encodeTransaction(this.rawTx);
  }

  constructor(
    rawTx: Omit<RawTx, 'status'>,
    status: TxStatus = TxStatus.Initialised,
  ) {
    this.rawTx = rawTx;
    this.status = status;
    this.provider = Transaction.provider;
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
   * broadcast
   *
   * @returns {Transaction}
   */
  broadcast(): Transaction {
    if (!this.signature) {
      throw new Error(
        'Cannot broadcast a transaction that has not been signed.',
      );
    }

    this.provider.send('CreateTransaction', this.rawTx).then(res => {
      if (res.error) {
        this.status = TxStatus.Rejected;
        return;
      }

      this.request = this.provider.send(
        'GetTransaction',
        this.pollTxConfirmation,
      );

      this.status = TxStatus.Pending;
    });

    return this;
  }

  /**
   * bind
   *
   * only runs if TxStatus is Confirmed or Initialiased.
   *
   * @param {(tx: RawTx) => Transaction} fn
   * @returns {Transaction}
   */
  bind(fn: (tx: RawTx) => Transaction): Transaction {
    return this.isConfirmed() || this.isInitialised() ? fn(this.rawTx) : this;
  }

  /**
   * map
   *
   * only runs if TxStatus is Confirmed or Initialiased.
   *
   * @param {(tx: RawTx) => RawTx} fn
   * @returns {Transaction}
   */
  map(fn: (tx: RawTx) => RawTx): Transaction {
    return this.isConfirmed() || this.isInitialised()
      ? Transaction.confirmed(fn(this.rawTx))
      : this;
  }

  /**
   * return
   *
   * Gives back the unboxed parameters
   *
   * @returns {RawTx}
   */
  return(): RawTx {
    return this.rawTx;
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
    this.status = TxStatus.Confirmed;
  }
}
