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

import elliptic from 'elliptic';
import hashjs from 'hash.js';

import { BN, validation } from '@zilliqa-js/util';

import { fromBech32Address, toBech32Address } from './bech32';

const secp256k1 = new elliptic.ec('secp256k1');

/**
 * getAddressFromPrivateKey
 *
 * takes a hex-encoded string (private key) and returns its corresponding
 * 20-byte hex-encoded address.
 *
 * @param {string} privateKey
 * @returns {string}
 */
export const getAddressFromPrivateKey = (privateKey: string): string => {
  const normalizedPrviateKey = normalizePrivateKey(privateKey);
  const keyPair = secp256k1.keyFromPrivate(normalizedPrviateKey, 'hex');
  const pub = keyPair.getPublic(true, 'hex');

  return toChecksumAddress(
    hashjs.sha256().update(pub, 'hex').digest('hex').slice(24),
  );
};

/**
 * getPubKeyFromPrivateKey
 *
 * takes a hex-encoded string (private key) and returns its corresponding
 * hex-encoded 33-byte public key.
 *
 * @param {string} privateKey
 * @returns {string}
 */
export const getPubKeyFromPrivateKey = (privateKey: string) => {
  const normalizedPrviateKey = normalizePrivateKey(privateKey);
  const keyPair = secp256k1.keyFromPrivate(normalizedPrviateKey, 'hex');
  return keyPair.getPublic(true, 'hex');
};

/**
 * getAccountFrom0xPrivateKey
 *
 * Utility method for recovering account from 0x private key.
 * See https://github.com/Zilliqa/zilliqa-js/pull/159
 * @param privateKeyWith0x : private key with 0x prefix
 */

export const getAccountFrom0xPrivateKey = (privateKeyWith0x: string) => {
  const privateKeyWithout0x = normalizePrivateKey(privateKeyWith0x);
  const keyPair = secp256k1.keyFromPrivate(privateKeyWith0x, 'hex');
  const publicKeyWith0x = keyPair.getPublic(true, 'hex');
  const addressWith0x = getAddressFromPublicKey(publicKeyWith0x);
  const bech32With0x = toBech32Address(addressWith0x);
  const with0x = {
    prv: privateKeyWith0x,
    pub: publicKeyWith0x,
    addr: addressWith0x,
    bech32: bech32With0x,
  };

  const keyPair2 = secp256k1.keyFromPrivate(privateKeyWithout0x, 'hex');
  const publicKeyWithout0x = keyPair2.getPublic(true, 'hex');
  const addressWithout0x = getAddressFromPublicKey(publicKeyWithout0x);
  const bech32Without0x = toBech32Address(addressWithout0x);
  const without0x = {
    prv: privateKeyWithout0x,
    pub: publicKeyWithout0x,
    addr: addressWithout0x,
    bech32: bech32Without0x,
  };

  const privateKeyAfterChange = keyPair.getPrivate('hex');
  const publicKeyAfterChange = keyPair.getPublic(true, 'hex');
  const addressAfterChange = getAddressFromPublicKey(publicKeyAfterChange);
  const bech32AfterChange = toBech32Address(addressAfterChange);

  const changed = {
    prv: privateKeyAfterChange,
    pub: publicKeyAfterChange,
    addr: addressAfterChange,
    bech32: bech32AfterChange,
  };

  return {
    with0x,
    without0x,
    changed,
  };
};

/**
 * compressPublicKey
 *
 * @param {string} publicKey - 65-byte public key, a point (x, y)
 *
 * @returns {string}
 */
export const compressPublicKey = (publicKey: string): string => {
  return secp256k1.keyFromPublic(publicKey, 'hex').getPublic(true, 'hex');
};

/**
 * getAddressFromPublicKey
 *
 * takes hex-encoded string and returns the corresponding address
 *
 * @param {string} pubKey
 * @returns {string}
 */
export const getAddressFromPublicKey = (publicKey: string) => {
  const normalized = publicKey.toLowerCase().replace('0x', '');
  return toChecksumAddress(
    hashjs.sha256().update(normalized, 'hex').digest('hex').slice(24),
  );
};

/**
 * toChecksumAddress
 *
 * takes hex-encoded string and returns the corresponding address
 *
 * @param {string} address
 * @returns {string}
 */
export const toChecksumAddress = (address: string): string => {
  if (!validation.isAddress(address)) {
    throw new Error(`${address} is not a valid base 16 address`);
  }

  address = address.toLowerCase().replace('0x', '');
  const hash = hashjs.sha256().update(address, 'hex').digest('hex');
  const v = new BN(hash, 'hex', 'be');
  let ret = '0x';

  for (let i = 0; i < address.length; i++) {
    if ('0123456789'.indexOf(address[i]) !== -1) {
      ret += address[i];
    } else {
      ret += v.and(new BN(2).pow(new BN(255 - 6 * i))).gte(new BN(1))
        ? address[i].toUpperCase()
        : address[i].toLowerCase();
    }
  }

  return ret;
};

/**
 * isValidChecksumAddress
 *
 * takes hex-encoded string and returns boolean if address is checksumed
 *
 * @param {string} address
 * @returns {boolean}
 */
export const isValidChecksumAddress = (address: string): boolean => {
  return (
    validation.isAddress(address.replace('0x', '')) &&
    toChecksumAddress(address) === address
  );
};

/**
 * normaliseAddress
 *
 * takes in a base16 address or a zilliqa bech32 encoded address
 * and returns a checksum base16 address. If the address is neither a base16
 * nor bech32 address, the code will return an error
 * @param {string)} address
 * @returns {string}
 */
export const normaliseAddress = (address: string): string => {
  if (validation.isBech32(address)) {
    return fromBech32Address(address);
  }

  if (!isValidChecksumAddress(address)) {
    throw Error(
      'Wrong address format, should be either bech32 or checksummed address',
    );
  }

  return address;
};

/**
 * encodeBase58 - may be required for DID public key
 * undeprecating this function after version 2.0.0
 *
 * @param {string} hex - base 16 encoded string
 * @returns {string} - big endian base 58 encoded string
 */
export const encodeBase58 = (hex: string): string => {
  const clean = hex.toLowerCase().replace('0x', '');
  const tbl = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  const base = new BN(58);
  const zero = new BN(0);
  let x = new BN(clean, 16);
  let res = '';

  while (x.gt(zero)) {
    const rem = x.mod(base).toNumber(); // safe, always < 58
    // big endian
    res = tbl[rem] + res;
    // quotient, remainders thrown away in integer division
    x = x.div(base);
  }

  // convert to big endian in case the input hex is little endian
  const hexBE = x.toString('hex', clean.length);
  for (let i = 0; i < hexBE.length; i += 2) {
    if (hex[i] === '0' && hex[i + 1] === '0') {
      res = tbl[0] + res;
    } else {
      break;
    }
  }

  return res;
};

/**
 * decodeBase58 - may be required for DID public key
 * undeprecating this function after version 2.0.0
 *
 * @param {string} raw - base 58 string
 * @returns {string} - big endian base 16 string
 */
export const decodeBase58 = (raw: string): string => {
  const tbl = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  const base = new BN(58);
  const zero = new BN(0);
  let isBreak = false;
  let n = new BN(0);
  let leader = '';

  for (let i = 0; i < raw.length; i++) {
    const char = raw.charAt(i);
    const weight = new BN(tbl.indexOf(char));
    n = n.mul(base).add(weight);

    // check if padding required
    if (!isBreak) {
      if (i - 1 > 0 && raw[i - 1] !== '1') {
        isBreak = true;
        continue;
      }
      if (char === '1') {
        leader += '00';
      }
    }
  }
  if (n.eq(zero)) {
    return leader;
  }

  let res = leader + n.toString('hex');
  if (res.length % 2 !== 0) {
    res = '0' + res;
  }

  return res;
};

/**
 * verifyPrivateKey
 *
 * @param {string|Buffer} privateKey
 * @returns {boolean}
 */
export const verifyPrivateKey = (privateKey: string): boolean => {
  const keyPair = secp256k1.keyFromPrivate(privateKey, 'hex');
  const { result } = keyPair.validate();
  return result;
};

/**
 * normalizePrivateKey : normalise private key from 0x or without 0x prefix
 *
 * @param {string} privateKey
 * @returns {string}
 */

export const normalizePrivateKey = (privateKey: string): string => {
  try {
    if (!validation.isPrivateKey(privateKey)) {
      throw new Error('Private key is not correct');
    }
    const normalized = privateKey.toLowerCase().replace('0x', '');
    if (!verifyPrivateKey(normalized)) {
      throw new Error('Private key is not correct');
    }
    return normalized;
  } catch (error) {
    throw error;
  }
};
