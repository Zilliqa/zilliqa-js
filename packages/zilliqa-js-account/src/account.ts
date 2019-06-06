import * as zcrypto from '@zilliqa-js/crypto';
import {
  SchnorrParty2,
  SchnorrParty2Share,
  SchnorrSignature,
} from '@kzen-networks/thresh-sig';

const P1_ENDPOINT = 'http://localhost:8000';

export class Account {
  p2: SchnorrParty2;
  // @ts-ignore
  share: SchnorrParty2Share;
  // @ts-ignore
  publicKey: string;
  // @ts-ignore
  address: string;

  constructor() {
    this.p2 = new SchnorrParty2(P1_ENDPOINT);
  }

  /**
   * create
   *
   * Creates a new share for the 2-of-2 Schnorr signature scheme.
   * Should be called only once.
   *
   * @returns {string} - address of the new account
   */
  async create() {
    if (this.share) {
      throw new Error(
        'create should be called only once per account initialization',
      );
    }
    this.share = await this.p2.generateKey();
    this.publicKey = this.share
      .getPublicKey()
      .encodeCompressed('hex')
      .toString('hex');
    this.address = zcrypto.getAddressFromPublicKey(this.publicKey);
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
