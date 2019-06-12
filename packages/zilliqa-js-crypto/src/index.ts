import * as schnorr from './schnorr';
import hash from 'hash.js';

/**
 * sign
 *
 * @param {string} hash - hex-encoded hash of the data to be signed
 *
 * @returns {string} the signature
 */
export const sign = (
  msg: Buffer,
  privateKey: string,
  pubKey: string,
): string => {
  const sig = schnorr.sign(
    msg,
    Buffer.from(privateKey, 'hex'),
    Buffer.from(pubKey, 'hex'),
  );

  let r = sig.r.toString('hex');
  let s = sig.s.toString('hex');
  while (r.length < 64) {
    r = '0' + r;
  }
  while (s.length < 64) {
    s = '0' + s;
  }

  return r + s;
};

export { schnorr };
export { hash };
export * from './zilAddress';
export * from './util';
export * from './keystore';
export * from './random';
export * from './types';
export * from './signature';
export * from './bech32';
