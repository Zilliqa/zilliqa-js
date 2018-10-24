declare module 'hmac-drbg' {
  import hash from 'hash.js';

  interface DRBGOpt {
    hash: typeof hash[keyof typeof hash];
    entropy: string | Buffer;
    entropyEnc?: 'hex';
    nonce: string | Buffer;
    nonceEnc?: 'hex';
    pers: string | Buffer;
    persEnc?: 'hex';
  }

  export default class HmacDRBG {
    constructor(opt: DRBGOpt);
    reseed(
      entropy: string | Buffer,
      entropyEnc: 'hex',
      add: string | Buffer,
      addEnc: 'hex',
    ): HmacDRBG;
    generate(len: number, enc?: 'hex', add?: string | Buffer, addEnc?: 'hex'): string;
  }
}
