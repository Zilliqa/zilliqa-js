import {
  GET_TX_ATTEMPTS,
  Provider,
  RPCResponse,
  Signable,
} from '@zilliqa-js/core';
import { getAddressFromPublicKey, toChecksumAddress } from '@zilliqa-js/crypto';
import { BN, Long } from '@zilliqa-js/util';

import { TxIncluded, TxParams, TxReceipt, TxStatus } from './types';
import { encodeTransactionProto, sleep } from './util';

/**
 * Transaction
 *
 * Transaction is a functor. Its purpose is to encode the possible states a
 * Transaction can be in:  Confirmed, Rejected, Pending, or Initialised (i.e., not broadcasted).
 */
export class Transaction implements Signable {
  errorMap = new Map([
    [0, 'CHECKER_FAILED'],
    [1, 'RUNNER_FAILED'],
    [2, 'BALANCE_TRANSFER_FAILED'],
    [3, 'EXECUTE_CMD_FAILED'],
    [4, 'EXECUTE_CMD_TIMEOUT'],
    [5, 'NO_GAS_REMAINING_FOUND'],
    [6, 'NO_ACCEPTED_FOUND'],
    [7, 'CALL_CONTRACT_FAILED'],
    [8, 'CREATE_CONTRACT_FAILED'],
    [9, 'JSON_OUTPUT_CORRUPTED'],
    [10, 'CONTRACT_NOT_EXIST'],
    [11, 'STATE_CORRUPTED'],
    [12, 'LOG_ENTRY_INSTALL_FAILED'],
    [13, 'MESSAGE_CORRUPTED'],
    [14, 'RECEIPT_IS_NULL'],
    [15, 'MAX_DEPTH_REACHED'],
    [16, 'CHAIN_CALL_DIFF_SHARD'],
    [17, 'PREPARATION_FAILED'],
    [18, 'NO_OUTPUT'],
    [19, 'OUTPUT_ILLEGAL'],
  ]);

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
  id?: string;
  status: TxStatus;

  // parameters
  private version: number;
  private nonce?: number;
  private toAddr: string;
  private pubKey?: string;
  private amount: BN;
  private gasPrice: BN;
  private gasLimit: Long;
  private code: string;
  private data: string;
  private receipt?: TxReceipt;
  private signature?: string;

  get bytes(): Buffer {
    return encodeTransactionProto(this.txParams);
  }

  get senderAddress(): string {
    if (!this.pubKey) {
      return '0'.repeat(40);
    }

    return getAddressFromPublicKey(this.pubKey);
  }

  get txParams(): TxParams {
    return {
      version: this.version,
      // TODO: do not strip 0x after implementation on core side
      toAddr: toChecksumAddress(this.toAddr).slice(2),
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
      version: 0,
      toAddr: this.toAddr,
      nonce: this.nonce,
      pubKey: this.pubKey,
      amount: this.amount.toString(),
      gasPrice: this.gasPrice.toString(),
      gasLimit: this.gasLimit.toString(),
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
    this.toAddr = params.toAddr.toLowerCase();
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

  getReceipt(): undefined | TxReceipt {
    return this.receipt;
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
   * The polls are performed with a linear backoff:
   *
   * `const delay = interval * attempt`
   *
   * This is a low-level method that you should generally not have to use
   * directly.
   *
   * @param {string} txHash
   * @param {number} maxAttempts
   * @param {number} initial interval in milliseconds
   * @returns {Promise<Transaction>}
   */
  async confirm(
    txHash: string,
    maxAttempts = GET_TX_ATTEMPTS,
    interval = 1000,
  ): Promise<Transaction> {
    this.status = TxStatus.Pending;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        if (await this.trackTx(txHash)) {
          return this;
        }
      } catch (err) {
        this.status = TxStatus.Rejected;
        throw err;
      }
      if (attempt + 1 < maxAttempts) {
        await sleep(interval * attempt);
      }
    }
    this.status = TxStatus.Rejected;
    throw new Error(
      `The transaction is still not confirmed after ${maxAttempts} attempts.`,
    );
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
    this.toAddr = params.toAddr;
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

  private async trackTx(txHash: string): Promise<boolean> {
    // TODO: regex validation for txHash so we don't get garbage
    const res: RPCResponse<TxIncluded, string> = await this.provider.send(
      'GetTransaction',
      txHash,
    );

    if (res.error) {
      return false;
    }

    this.id = res.result.ID;
    this.receipt = res.result.receipt;
    if (!this.receipt.success) {
      const err = this.receipt.errors;
      if (err !== undefined) {
        const values = Object.values(err);
        const code = values.flat(2)[0];
        this.receipt.error_message = this.errorMap.get(code);
      }
    }
    this.status =
      this.receipt && this.receipt.success
        ? TxStatus.Confirmed
        : TxStatus.Rejected;
    return true;
  }
}
