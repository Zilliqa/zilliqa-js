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

declare module 'hmac-drbg' {
  import hash from 'hash.js';

  interface DRBGOpt {
    hash: typeof hash[keyof typeof hash];
    entropy: string | Buffer;
    entropyEnc?: 'hex';
    nonce: string | Buffer;
    nonceEnc?: 'hex';
    pers: string | Buffer;
    persEnc?: 'hex';
  }

  export default class HmacDRBG {
    constructor(opt: DRBGOpt);
    reseed(
      entropy: string | Buffer,
      entropyEnc: 'hex',
      add: string | Buffer,
      addEnc: 'hex',
    ): HmacDRBG;
    generate(
      len: number,
      enc?: 'hex',
      add?: string | Buffer,
      addEnc?: 'hex',
    ): string;
  }
}
