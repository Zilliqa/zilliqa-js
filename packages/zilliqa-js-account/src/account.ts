import * as zcrypto from 'zilliqa-js-crypto';
import hash from 'hash.js';
import {Transaction} from './types';
import {encodeTransaction} from './util';

export default class Account {
  privateKey: string;
  publicKey: string;
  address: string;

  /**
   * fromFile
   *
   * Takes a JSON-encoded keystore and passphrase, returning a fully
   * instantiated Account instance.
   *
   * @param {string} file
   * @param {string} passphrase
   * @returns {Promise<Account>}
   */
  static async fromFile(file: string, passphrase: string): Promise<Account> {
    try {
      const keystore = JSON.parse(file);
      const privateKey = await zcrypto.decryptPrivateKey(passphrase, keystore);

      return new Account(privateKey);
    } catch (err) {
      throw new Error(`Could not decrypt keystore file.`);
    }
  }

  constructor(privateKey: string) {
    this.privateKey = privateKey;
    this.publicKey = zcrypto.getPubKeyFromPrivateKey(this.privateKey);
    this.address = zcrypto.getAddressFromPublicKey(this.publicKey);
  }

  /**
   * toFile
   *
   * @param {string} passphrase
   * @param {kdf} 'pbkdf2' | 'scrypt'
   * @returns {Promise<string>}
   */
  async toFile(
    passphrase: string,
    kdf: 'pbkdf2' | 'scrypt' = 'scrypt',
  ): Promise<string> {
    if (!passphrase || !passphrase.length) {
      throw new Error('Passphrase cannot have a length of 0');
    }

    const keystore = await zcrypto.encryptPrivateKey(
      kdf,
      this.privateKey,
      passphrase,
    );

    return keystore;
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
