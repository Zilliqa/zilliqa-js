declare module 'elliptic/lib/elliptic/ec/signature' {
  import BN from 'bn.js';

  interface Options {
    r: string | BN;
    s: string | BN;
  }

  interface Signature {
    r: BN;
    s: BN;
  }

  var Signature: {
    new(opt: Options): Signature;
    new(data: Buffer): Signature;
  };

  export = Signature;
}
