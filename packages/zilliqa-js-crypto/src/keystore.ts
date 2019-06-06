import aes from 'aes-js';
import hashjs from 'hash.js';
import { pbkdf2Sync } from 'pbkdf2';
import scrypt from 'scrypt.js';
import uuid from 'uuid';

import { bytes } from '@zilliqa-js/util';

import { randomBytes } from './random';
import {
  KeystoreV3,
  KDF,
  KDFParams,
  PBKDF2Params,
  ScryptParams,
} from './types';
import { getAddressFromPublicKey } from './util';
import { SchnorrParty2Share } from '@kzen-networks/thresh-sig';

const ALGO_IDENTIFIER = 'aes-128-ctr';

/**
 * getDerivedKey
 *
 * NOTE: only scrypt and pbkdf2 are supported.
 *
 * @param {Buffer} key - the passphrase
 * @param {KDF} kdf - the key derivation function to be used
 * @param {KDFParams} params - params for the kdf
 *
 * @returns {Promise<Buffer>}
 */
async function getDerivedKey(
  key: Buffer,
  kdf: KDF,
  params: KDFParams,
): Promise<Buffer> {
  const salt = Buffer.from(params.salt, 'hex');

  if (kdf === 'pbkdf2') {
    const { c, dklen } = params as PBKDF2Params;
    return pbkdf2Sync(key, salt, c, dklen, 'sha256');
  }

  if (kdf === 'scrypt') {
    const { n, r, p, dklen } = params as ScryptParams;
    return scrypt(key, salt, n, r, p, dklen);
  }

  throw new Error('Only pbkdf2 and scrypt are supported');
}

/**
 * encryptShare
 *
 * Encodes and encrypts a private share.
 * Note that, in keeping with the hash function used by Zilliqa's
 * core protocol, the MAC is generated using sha256 instead of keccak.
 *
 * NOTE: only scrypt and pbkdf2 are supported.
 *
 * @param {KDF} kdf - the key derivation function to be used
 * @param {string} share - hex-encoded private key
 * @param {string} passphrase - a passphrase used for encryption
 *
 * @returns {Promise<string>}
 */
export const encryptShare = async (
  kdf: KDF,
  share: SchnorrParty2Share,
  passphrase: string,
): Promise<string> => {
  const address = getAddressFromPublicKey(
    share
      .getPublicKey()
      .encodeCompressed('hex')
      .toString('hex'),
  );
  const salt = randomBytes(32);
  const iv = Buffer.from(randomBytes(16), 'hex');
  const kdfparams = {
    salt,
    n: 8192,
    c: 262144,
    r: 8,
    p: 1,
    dklen: 32,
  };

  const derivedKey = await getDerivedKey(
    Buffer.from(passphrase),
    kdf,
    kdfparams,
  );
  const cipher = new aes.ModeOfOperation.ctr(
    derivedKey.slice(0, 16),
    new aes.Counter(iv),
  );
  const ciphertext = Buffer.from(
    cipher.encrypt(Buffer.from(JSON.stringify(share))),
  );

  return JSON.stringify({
    address,
    crypto: {
      cipher: ALGO_IDENTIFIER,
      cipherparams: {
        iv: iv.toString('hex'),
      },
      ciphertext: ciphertext.toString('hex'),
      kdf,
      kdfparams,
      mac: hashjs
        // @ts-ignore
        .hmac(hashjs.sha256, derivedKey, 'hex')
        .update(
          Buffer.concat([
            derivedKey.slice(16, 32),
            ciphertext,
            iv,
            Buffer.from(ALGO_IDENTIFIER),
          ]),
          'hex',
        )
        .digest('hex'),
    },
    id: uuid.v4({ random: bytes.hexToIntArray(randomBytes(16)) }),
    version: 3,
  });
};

/**
 * decryptShare
 *
 * Recovers the share from a keystore file using the given passphrase.
 *
 * @param {string} passphrase
 * @param {KeystoreV3} keystore
 * @returns {Promise<string>}
 */
export const decryptShare = async (
  passphrase: string,
  keystore: KeystoreV3,
): Promise<SchnorrParty2Share> => {
  const ciphertext = Buffer.from(keystore.crypto.ciphertext, 'hex');
  const iv = Buffer.from(keystore.crypto.cipherparams.iv, 'hex');
  const kdfparams = keystore.crypto.kdfparams;

  const derivedKey = await getDerivedKey(
    Buffer.from(passphrase),
    keystore.crypto.kdf,
    kdfparams,
  );

  const mac = hashjs
    // @ts-ignore
    .hmac(hashjs.sha256, derivedKey, 'hex')
    .update(
      Buffer.concat([
        derivedKey.slice(16, 32),
        ciphertext,
        iv,
        Buffer.from(ALGO_IDENTIFIER),
      ]),
      'hex',
    )
    .digest('hex');

  // we need to do a byte-by-byte comparison to avoid non-constant time side
  // channel attacks.
  if (!bytes.isEqual(mac.toUpperCase(), keystore.crypto.mac.toUpperCase())) {
    return Promise.reject('Failed to decrypt.');
  }

  const cipher = new aes.ModeOfOperation.ctr(
    derivedKey.slice(0, 16),
    new aes.Counter(iv),
  );

  return SchnorrParty2Share.fromPlain(
    JSON.parse(Buffer.from(cipher.decrypt(ciphertext)).toString()),
  );
};
