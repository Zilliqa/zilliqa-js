import * as zcrypto from '@zilliqa-js/crypto';

export class Account {
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

  privateKey: string;
  publicKey: string;
  address: string;

  get checksumAddress(): string {
    try {
      return zcrypto.getAddress(this.address).checkSum;
    } catch (error) {
      throw error;
    }
  }

  get bech32Address(): string {
    try {
      return zcrypto.getAddress(this.address).bech32;
    } catch (error) {
      throw error;
    }
  }
  get bech32TestNetAddress(): string {
    try {
      return zcrypto.getAddress(this.address).bech32TestNet;
    } catch (error) {
      throw error;
    }
  }
  get base58Address(): string {
    try {
      return zcrypto.getAddress(this.address).base58;
    } catch (error) {
      throw error;
    }
  }
  get hexAddress(): string {
    try {
      return zcrypto.getAddress(this.address).bytes20Hex;
    } catch (error) {
      throw error;
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
   * @param {Buffer} bytes - the data to be signed
   *
   * @returns {string} - the hex encoded signature. it is a concatenation of
   * the r and s values in hex, each padded to a length of 64.
   */
  signTransaction(bytes: Buffer) {
    return zcrypto.sign(bytes, this.privateKey, this.publicKey);
  }
}
