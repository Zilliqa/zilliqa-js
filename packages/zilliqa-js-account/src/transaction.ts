import {
  GET_TX_ATTEMPTS,
  Provider,
  RPCResponse,
  Signable,
} from '@zilliqa-js/core';
import {
  getAddressFromPublicKey,
  getAddress,
  AddressType,
} from '@zilliqa-js/crypto';
import { BN, Long } from '@zilliqa-js/util';

import { TxParams, TxReceipt, TxStatus, TxIncluded } from './types';
import { encodeTransactionProto, sleep } from './util';

/**
 * Transaction
 *
 * Transaction is a functor. Its purpose is to encode the possible states a
 * Transaction can be in:  Confirmed, Rejected, Pending, or Initialised (i.e., not broadcasted).
 */
export class Transaction implements Signable {
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
  toDS: boolean;

  // parameters
  private version: number;
  private nonce?: number;
  private toAddr: string;
  private pubKey?: string;
  private amount: BN;
  private gasPrice: BN;
  private gasLimit: Long;
  private code: string = '';
  private data: string = '';
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
      // toAddr: this.normaliseAddress(this.toAddr),
      toAddr: getAddress(
        this.toAddr,
        [AddressType.bech32, AddressType.checkSum],
        AddressType.checkSum,
      ),
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
    toDS: boolean = false,
  ) {
    // private members
    this.version = params.version;
    // this.toAddr = this.normaliseAddress(params.toAddr);
    this.toAddr = getAddress(
      params.toAddr,
      [AddressType.bech32, AddressType.checkSum],
      AddressType.checkSum,
    );
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
    this.toDS = toDS;
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
    // this.toAddr = this.normaliseAddress(params.toAddr);
    this.toAddr = getAddress(
      params.toAddr,
      [AddressType.bech32, AddressType.checkSum],
      AddressType.checkSum,
    );
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

  // private normaliseAddress(address: string) {
  //   if (validation.isBech32(address)) {
  //     return fromBech32Address(address);
  //   }

  //   if (isValidChecksumAddress(address)) {
  //     return address;
  //   }

  //   throw new Error('Address format is invalid');
  // }

  private async trackTx(txHash: string): Promise<boolean> {
    const res: RPCResponse<TxIncluded, string> = await this.provider.send(
      'GetTransaction',
      txHash,
    );

    if (res.error) {
      return false;
    }

    this.id = res.result.ID;
    this.receipt = {
      ...res.result.receipt,
      cumulative_gas: parseInt(res.result.receipt.cumulative_gas, 10),
    };
    this.status =
      this.receipt && this.receipt.success
        ? TxStatus.Confirmed
        : TxStatus.Rejected;
    return true;
  }
}
