import elliptic from 'elliptic';

import { randomBytes } from './random';
import * as schnorr from './schnorr';

const HEX_ENC: 'hex' = 'hex';
const secp256k1 = elliptic.ec('secp256k1');

/**
 * generatePrivateKey
 *
 * @returns {string} - the hex-encoded private key
 */
export const generatePrivateKey = (): string => {
  return secp256k1
    .genKeyPair({
      entropy: randomBytes(secp256k1.curve.n.byteLength()),
      entropyEnc: HEX_ENC,
      pers: 'zilliqajs+secp256k1+SHA256',
    })
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
