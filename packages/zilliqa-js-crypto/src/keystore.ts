//  Copyright (C) 2018 Zilliqa
//
//  This file is part of zilliqa-js
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU General Public License for more details.
//
//  You should have received a copy of the GNU General Public License
//  along with this program.  If not, see <https://www.gnu.org/licenses/>.

import aes from 'aes-js';
import hashjs from 'hash.js';
import { pbkdf2Sync } from 'pbkdf2';
import scrypt from 'scrypt-js';
import { v4 as uuidv4 } from 'uuid';

import { bytes } from '@zilliqa-js/util';

import { randomBytes } from './random';
import {
  KeystoreV3,
  KDF,
  KDFParams,
  PBKDF2Params,
  ScryptParams,
} from './types';
import { getAddressFromPrivateKey } from './util';

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
    const derivedKeyInt8Array = scrypt.syncScrypt(key, salt, n, r, p, dklen);
    return Buffer.from(derivedKeyInt8Array);
  }

  throw new Error('Only pbkdf2 and scrypt are supported');
}

/**
 * encryptPrivateKey
 *
 * Encodes and encrypts an account in the format specified by
 * https://github.com/ethereum/wiki/wiki/Web3-Secret-Storage-Definition.
 * However, note that, in keeping with the hash function used by Zilliqa's
 * core protocol, the MAC is generated using sha256 instead of keccak.
 *
 * NOTE: only scrypt and pbkdf2 are supported.
 *
 * @param {KDF} kdf - the key derivation function to be used
 * @param {string} privateKey - hex-encoded private key
 * @param {string} passphrase - a passphrase used for encryption
 *
 * @returns {Promise<string>}
 */
export const encryptPrivateKey = async (
  kdf: KDF,
  privateKey: string,
  passphrase: string,
): Promise<string> => {
  const address = getAddressFromPrivateKey(privateKey);
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
    cipher.encrypt(Buffer.from(privateKey, 'hex')),
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
    id: uuidv4({ random: bytes.hexToIntArray(randomBytes(16)) }),
    version: 3,
  });
};

/**
 * decryptPrivateKey
 *
 * Recovers the private key from a keystore file using the given passphrase.
 *
 * @param {string} passphrase
 * @param {KeystoreV3} keystore
 * @returns {Promise<string>}
 */
export const decryptPrivateKey = async (
  passphrase: string,
  keystore: KeystoreV3,
): Promise<string> => {
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

  return Buffer.from(cipher.decrypt(ciphertext)).toString('hex');
};
