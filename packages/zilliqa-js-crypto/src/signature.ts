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

import { BN } from '@zilliqa-js/util';

/**
 * Signature
 *
 * This replaces `elliptic/lib/elliptic/ec/signature`. This is to avoid
 * duplicate code in the final bundle, caused by having to bundle elliptic
 * twice due to its circular dependencies. This can be removed once
 * https://github.com/indutny/elliptic/pull/157 is resolved, or we find the
 * time to fork an optimised version of the library.
 */
interface SignatureOpt {
  r: string | BN;
  s: string | BN;
}

export class Signature {
  r: BN;
  s: BN;

  constructor(options: SignatureOpt) {
    this.r = typeof options.r === 'string' ? new BN(options.r, 16) : options.r;
    this.s = typeof options.s === 'string' ? new BN(options.s, 16) : options.s;
  }
}
