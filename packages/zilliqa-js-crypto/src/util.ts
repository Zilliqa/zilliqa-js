import elliptic from 'elliptic';
import hashjs from 'hash.js';

import { validation } from '@zilliqa-js/util';

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

  return hashjs
    .sha256()
    .update(pub, 'hex')
    .digest('hex')
    .slice(24);
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
  return hashjs
    .sha256()
    .update(publicKey, 'hex')
    .digest('hex')
    .slice(24);
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
  address = address.toLowerCase().replace('0x', '');
  const hash = hashjs
    .sha256()
    .update(address, 'hex')
    .digest('hex');
  let ret = '0x';
  for (let i = 0; i < address.length; i++) {
    if (parseInt(hash[i], 16) >= 8) {
      ret += address[i].toUpperCase();
    } else {
      ret += address[i];
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
