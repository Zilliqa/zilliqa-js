import * as zcrypto from '@zilliqa/zilliqa-js-crypto';
import Transaction from './transaction';

export default class Account {
  privateKey: string;
  publicKey: string;
  address: string;
  nonce: number;

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

  constructor(privateKey: string, nonce?: number) {
    this.privateKey = privateKey;
    this.publicKey = zcrypto.getPubKeyFromPrivateKey(this.privateKey);
    this.address = zcrypto.getAddressFromPublicKey(this.publicKey);
    this.nonce = nonce || 0;
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
   * @param {Buffer} bytes - the data to be signed
   *
   * @returns {string} - the hex encoded signature. it is a concatenation of
   * the r and s values in hex, each padded to a length of 64.
   */
  signTransaction(bytes: Buffer) {
    return zcrypto.sign(bytes, this.privateKey, this.publicKey);
  }
}
