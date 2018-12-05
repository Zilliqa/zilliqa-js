import elliptic from 'elliptic';
import { BN } from '@zilliqa-js/util';

import { randomBytes } from './random';
import * as schnorr from './schnorr';

const NUM_BYTES = 32;

/**
 * generatePrivateKey
 *
 * @returns {string} - the hex-encoded private key
 */
export const generatePrivateKey = (): string => {
  let privateKey: string = randomBytes(NUM_BYTES);
  let privateKeyBN: BN = new BN(privateKey, 'hex');

  while (
    privateKeyBN.isZero() ||
    privateKeyBN.gte(elliptic.ec('secp256k1').curve.n)
  ) {
    privateKey = randomBytes(NUM_BYTES);
    privateKeyBN = new BN(privateKey, 'hex');
  }

  return privateKey;
};

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
export * from './util';
export * from './keystore';
export * from './random';
export * from './types';
export * from './signature';
