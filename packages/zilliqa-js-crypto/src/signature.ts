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

import { BN } from '@zilliqa-js/util';

interface SignatureOptions {
  r: number | string | number[] | Uint8Array | Buffer | BN;
  s: number | string | number[] | Uint8Array | Buffer | BN;
}

// This replaces `elliptic/lib/elliptic/ec/signature`.
// Q. Why do we replace `elliptic/lib/elliptic/ec/signature` with this?
// A. At the moment, Signature() in 'elliptic' is not exposed.
export class Signature {
  r: BN;
  s: BN;
  constructor(options: SignatureOptions) {
    const isValid = options.r && options.s;
    if (!isValid) {
      throw new Error('Signature without r or s');
    }
    this.r = new BN(options.r, 16);
    this.s = new BN(options.s, 16);
  }
}
