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

import * as schnorr from './schnorr';

// This is a workaround. We need to improve it.
const Signature = require('elliptic/lib/elliptic/ec/signature');
// Q. Why do we use require() here?
// A. At the moment, Signature() in 'elliptic' is can only be imported
// from 'elliptic/lib/elliptic/ec/signature'. If we use ES6 import syntax,
// TS will try to generate d.ts from 'elliptic/lib/elliptic/ec/signature'
// causing an error with 'Could not find a declaration file for module ...' message.
// Therefore, we use require() here.
//
// Q. Why don't we use `ec.Signature` type for 'Signature()'?
// A. `Signature()` is a function while @types/elliptic defines it as following
//
// class Signature {
//   r: BN;
//   s: BN;
//   recoveryParam: number | null;
//   constructor(options: SignatureInput, enc?: string);
//   toDER(enc?: string | null): any; // ?
// }
//
// With the above `ec.Signature` type, `new Signature()` will throw an error
// since it doesn't have constructor().
// Therefore, we keep the type of Signature() as any.

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

export { schnorr, Signature };
export * from './util';
export * from './keystore';
export * from './random';
export * from './types';
export * from './bech32';
