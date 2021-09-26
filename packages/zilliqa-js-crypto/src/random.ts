//  Copyright (C) 2018 Zilliqa
//
//  This file is part of Zilliqa-Javascript-Library.
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

/**
 * randomBytes
 *
 * Uses JS-native CSPRNG to generate a specified number of bytes.
 * NOTE: this method throws if no PRNG is available.
 *
 * @param {number} bytes
 * @returns {string}
 */
export const randomBytes = (bytes: number) => {
  const b = Buffer.allocUnsafe(bytes);
  const n = b.byteLength;

  const isBrowserEnv =
    typeof window !== 'undefined' && typeof window.document !== 'undefined';

  const isWebWorkerEnv =
    typeof self === 'object' &&
    self.constructor?.name === 'DedicatedWorkerGlobalScope';

  const isNodeEnv = typeof process?.versions?.node === 'string';

  let crypto = undefined;
  if (isBrowserEnv || isWebWorkerEnv) {
    // web worker: self.crypto
    // browser: window.crypto
    // @ts-ignore
    crypto = global.crypto || global.msCrypto; // for IE 11
  }
  if (typeof crypto?.getRandomValues === 'function') {
    // For browser or web worker enviroment, use window.crypto.getRandomValues()
    // https://paragonie.com/blog/2016/05/how-generate-secure-random-numbers-in-various-programming-languages#js-csprng

    // limit of getRandomValues()
    // The requested length exceeds 65536 bytes.
    // https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues#exceptions
    const MAX_BYTES = 65536;
    for (let i = 0; i < n; i += MAX_BYTES) {
      // typedArray = crypto.getRandomValues(typedArray);
      // Note that typedArray is modified in-place, and no copy is made.
      crypto.getRandomValues(
        new Uint8Array(b.buffer, i + b.byteOffset, Math.min(n - i, MAX_BYTES)),
      );
    }
  } else if (isNodeEnv) {
    // For node enviroment, use sodium-native
    // https://paragonie.com/blog/2016/05/how-generate-secure-random-numbers-in-various-programming-languages#nodejs-csprng

    const sodium = require('sodium-native');
    sodium.randombytes_buf(b);
  } else {
    throw new Error('No secure random number generator available');
  }
  const randBz = new Uint8Array(
    b.buffer,
    b.byteOffset,
    b.byteLength / Uint8Array.BYTES_PER_ELEMENT,
  );

  let randStr = '';
  for (let i = 0; i < bytes; i++) {
    randStr += ('00' + randBz[i].toString(16)).slice(-2);
  }

  return randStr;
};
