import * as zcrypto from '@zilliqa-js/crypto';
import {
  SchnorrParty2,
  SchnorrParty2Share,
  SchnorrSignature,
} from '@kzen-networks/thresh-sig';

const P1_ENDPOINT = 'http://localhost:8000';

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
      const share: SchnorrParty2Share = await zcrypto.decryptShare(
        passphrase,
        keystore,
      );

      const account = new Account();
      account.init(share);
      return account;
    } catch (err) {
      throw new Error(`Could not decrypt keystore file.`);
    }
  }

  // @ts-ignore
  publicKey: string;
  // @ts-ignore
  address: string;
  // @ts-ignore
  private p2: SchnorrParty2;
  // @ts-ignore
  private share: SchnorrParty2Share;

  constructor() {
    this.p2 = new SchnorrParty2(P1_ENDPOINT);
  }

  /**
   * create
   *
   * Creates a new share for the 2-of-2 Schnorr signature scheme.
   * Should be called only once.
   * Note: this function assumes the co-signing server is up.
   *
   * @returns {string} - address of the new account
   */
  async create() {
    if (this.share) {
      throw new Error(
        'create should be called only once per account initialization',
      );
    }
    const share = await this.p2.generateKey();
    this.init(share);
  }

  protected init(share: SchnorrParty2Share) {
    this.share = share;
    this.publicKey = this.share
      .getPublicKey()
      .encodeCompressed('hex')
      .toString('hex');
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

    const keystore = await zcrypto.encryptShare(kdf, this.share, passphrase);

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
  async signTransaction(bytes: Buffer): Promise<string> {
    const signature: SchnorrSignature = await this.p2.sign(bytes, this.share);
    return signature.toBuffer().toString('hex');
  }
}
