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

declare module 'aes-js' {
  export class Counter {
    constructor(iv: Buffer);
    setValue(value: number): void;
    setBytes(bytes: Array<number> | Buffer | string): void;
    increment(): void;
  }

  class CTR {
    constructor(derivedKey: Buffer, iv: Counter);
    encrypt(bytes: Buffer): Uint8Array;
    decrypt(bytes: Buffer): Uint8Array;
  }

  export const ModeOfOperation: { ctr: typeof CTR };
}
