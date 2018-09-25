import * as zcrypto from 'zilliqa-js-crypto';
import hash from 'hash.js';
import {Transaction} from './types';
import {encodeTransaction} from './util';

export default class Account {
  privateKey: string;
  publicKey: string;
  address: string;

  constructor(privateKey: string) {
    this.privateKey = privateKey;
    this.publicKey = zcrypto.getPubKeyFromPrivateKey(this.privateKey);
    this.address = zcrypto.getAddressFromPublicKey(this.publicKey);
  }

  /**
   * signTransaction
   *
   * @param {Transaction} tx - JSON-encoded transaction
   *
   * @returns {string} - the hex encoded signature. it is a concatenation of
   * the r and s values in hex, each padded to a length of 64.
   */
  signTransaction(tx: Transaction) {
    const txBytes = encodeTransaction(tx);
    const txHash = hash
      .sha256()
      .update(txBytes, 'hex')
      .digest('hex');

    return zcrypto.sign(txHash, this.privateKey, this.publicKey);
  }
}
