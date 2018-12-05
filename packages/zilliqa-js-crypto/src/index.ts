import elliptic from 'elliptic';

import * as schnorr from './schnorr';

const HEX_ENC: 'hex' = 'hex';

/**
 * generatePrivateKey
 *
 * @returns {string} - the hex-encoded private key
 */
export const generatePrivateKey = (): string => {
  return elliptic
    .ec('secp256k1')
    .genKeyPair()
    .getPrivate(HEX_ENC);
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
