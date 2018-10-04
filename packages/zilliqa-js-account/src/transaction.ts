import {Provider, RPCResponse, Signable} from 'zilliqa-js-core';

import {BaseTx, TxStatus} from './types';
import {encodeTransaction} from './util';

type Handler = (tx: BaseTx) => BaseTx;

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
   * @param {BaseTx} params
   */
  static confirm(params: BaseTx) {
    return new Transaction(params, TxStatus.Confirmed);
  }

  static provider: Provider;

  static setProvider(provider: Provider) {
    Transaction.provider = provider;
  }

  private baseTx: BaseTx;
  private queued: any[];

  get bytes(): Buffer {
    return encodeTransaction({...this.baseTx});
  }

  status: TxStatus;

  constructor(baseTx: BaseTx, status: TxStatus = TxStatus.Initialised) {
    this.baseTx = {code: '', data: '', ...baseTx};
    this.status = status;
    this.queued = [];
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
   * @returns {Transaction}
   */
  confirmReceipt(txHash: string, timeout: number = 60000): Transaction {
    this.trackTx(txHash);
    setTimeout(() => {
      this.status = TxStatus.Rejected;
    }, timeout);

    return this;
  }

  private trackTx(txHash: string) {
    if (this.isRejected()) {
      return;
    }

    this.status = TxStatus.Pending;
    // TODO: regex validation for txHash so we don't get garbage
    const result = Transaction.provider.send('GetTransaction', [txHash]);

    result.then((res: RPCResponse) => {
      if (res.result.error) {
        this.trackTx(txHash);
        return;
      }

      this.baseTx = {
        ...this.baseTx,
        id: res.result['ID'],
        receipt: res.result.receipt,
      };

      this.handleConfirm(this.baseTx);
    });
  }

  private handleConfirm(res: BaseTx) {
    this.status === TxStatus.Confirmed;
    this.queued.forEach(fn => {
      fn(res);
    });
  }

  /**
   * bind
   *
   * Only runs if TxStatus is Confirmed or Initialiased. Bind can be used like
   * Promise.prototype.then.
   *
   * @param {BaseTx => Transaction} fn
   * @returns {Transaction}
   */
  bind(fn: (tx: BaseTx) => Transaction): Transaction {
    if (this.isPending()) {
      this.queued.push(fn);
    }

    return this.isConfirmed() || this.isInitialised() ? fn(this.baseTx) : this;
  }

  /**
   * map
   *
   * Only runs if TxStatus is Confirmed or Initialiased. Map can be used like
   * Promise.prototype.then.
   *
   * @param {(tx: BaseTx) => Signable} fn
   * @returns {Transaction}
   */
  map(fn: (tx: BaseTx) => BaseTx): Transaction {
    if (this.isPending()) {
      this.queued.push(fn);
    }

    if (this.isConfirmed() || this.isInitialised()) {
      this.baseTx = fn(this.baseTx);
    }

    return this;
  }

  /**
   * return
   *
   * Gives back the unboxed parameters
   *
   * @returns {RawTx}
   */
  return(): BaseTx {
    return this.baseTx;
  }
}
