//  This file is part of Zilliqa-Javascript-Library.
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//   This program is distributed in the hope that it will be useful,
//   but WITHOUT ANY WARRANTY; without even the implied warranty of
//   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//   GNU General Public License for more details.
//
//   You should have received a copy of the GNU General Public License
//   along with this program.  If not, see <https://www.gnu.org/licenses/>.

import elliptic from 'elliptic';
import hashjs from 'hash.js';

import { BN, validation } from '@zilliqa-js/util';
import { ZilAddress } from './zilAddress';

import { fromBech32Address } from './bech32';

const secp256k1 = elliptic.ec('secp256k1');

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
  const keyPair = secp256k1.keyFromPrivate(privateKey, 'hex');
  const pub = keyPair.getPublic(true, 'hex');

  return toChecksumAddress(
    hashjs
      .sha256()
      .update(pub, 'hex')
      .digest('hex')
      .slice(24),
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
  const keyPair = secp256k1.keyFromPrivate(privateKey, 'hex');
  return keyPair.getPublic(true, 'hex');
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
  return toChecksumAddress(
    hashjs
      .sha256()
      .update(publicKey, 'hex')
      .digest('hex')
      .slice(24),
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
  const hash = hashjs
    .sha256()
    .update(address, 'hex')
    .digest('hex');
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
 * takes in either a checksum base16 address or a zilliqa bech32 encoded address
 * and returns a checksum base16 address. If the provided string is either an
 * invalid checksum address or an invalid bech32 address, the function throws
 * an error.
 *
 * @param {string)} address
 * @returns {string}
 */
export const normaliseAddress = (address: string): string => {
  if (validation.isBech32(address)) {
    return fromBech32Address(address);
  }

  if (isValidChecksumAddress(address)) {
    return address;
  }

  throw new Error('Address format is invalid');
};

/**
 * encodeBase58
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
 * decodeBase58
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
 * getAddress
 *
 *
 *
 * @param {string} address - an address to transform
 * @returns {ZilAddress} - return `toType` specific format of address
 */
export const getAddress = (address: string): ZilAddress => {
  try {
    return new ZilAddress(address);
  } catch (error) {
    throw error;
  }
};
