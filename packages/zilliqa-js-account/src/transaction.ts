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

      return Transaction.confirm(res.result);
    });
  }

  static provider: Provider;

  static setProvider(provider: Provider) {
    Transaction.provider = provider;
  }

  private baseTx: BaseTx;

  get bytes(): Buffer {
    return encodeTransaction({...this.baseTx});
  }

  status: TxStatus;

  constructor(baseTx: BaseTx, status: TxStatus = TxStatus.Initialised) {
    this.baseTx = baseTx;
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
   * confirm
   *
   * Similar to the Promise API. This sets the Transaction instance to a state
   * of pending. Calling this function kicks off a passive loop that polls the
   * lookup node for confirmation on the txHash.
   *
   * This is a low-level method that you should generally not have to use
   * directly.
   *
   * @param {string} txHash
   * @param {Handler} confirm
   * @param {Handler} reject
   * @returns {Promise<Transaction>}
   */
  confirm(
    txHash: string,
    confirm: Handler,
    reject: Handler,
  ): Promise<Transaction> {
    // TODO
    return Promise.resolve(this);
  }

  /**
   * bind
   *
   * only runs if TxStatus is Confirmed or Initialiased.
   *
   * @param {BaseTx => Transaction} fn
   * @returns {Transaction}
   */
  bind(fn: (tx: BaseTx) => Transaction): Transaction {
    return this.isConfirmed() || this.isInitialised() ? fn(this.baseTx) : this;
  }

  /**
   * map
   *
   * only runs if TxStatus is Confirmed or Initialiased.
   *
   * @param {(tx: BaseTx) => Signable} fn
   * @returns {Transaction}
   */
  map(fn: (tx: BaseTx) => BaseTx): Transaction {
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
