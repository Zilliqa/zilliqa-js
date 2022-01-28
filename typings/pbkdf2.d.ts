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

declare module 'pbkdf2' {
  type Digest =
    | 'md5'
    | 'sha1'
    | 'sha224'
    | 'sha256'
    | 'sha384'
    | 'sha512'
    | 'rmd160'
    | 'ripemd160';

  function pbkdf2Sync(
    passphrase: Buffer,
    salt: Buffer,
    n: number,
    dklen: number,
    digest: Digest,
  ): Buffer;

  function pbkdf2(
    passphrase: Buffer,
    salt: Buffer,
    n: number,
    dklen: number,
    digest: Digest,
    cb: (err: any, derivedKey: Buffer) => void,
  ): void;

  interface Exported {
    pbkdf2: typeof pbkdf2;
    pbkdf2Sync: typeof pbkdf2Sync;
  }

  var exports: Exported;

  export = exports;
}
