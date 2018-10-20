import BN from 'bn.js';

/**
 * Signature
 *
 * This replaces `elliptic/lib/elliptic/ec/signature`. This is to avoid
 * duplicate code in the final bundle, caused by having to bundle elliptic
 * twice due to its circular dependencies. This can be removed once
 * https://github.com/indutny/elliptic/pull/157 is resolved, or we find the
 * time to fork an optimised version of the library.
 */
interface SignatureOpt {
  r: string | BN;
  s: string | BN;
}

export default class Signature {
  r: BN;
  s: BN;

  constructor(options: SignatureOpt) {
    this.r = typeof options.r === 'string' ? new BN(options.r, 16) : options.r;
    this.s = typeof options.s === 'string' ? new BN(options.s, 16) : options.s;
  }
}
