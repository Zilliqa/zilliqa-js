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

import BN from 'bn.js';

declare namespace Elliptic {
  type HexEnc = 'hex';
  type Utf8Enc = 'utf8';
  type CurveTypes = 'short' | 'edwards' | 'mont';
  type PrivateKey =
    | string
    | Buffer
    | { x: Buffer; y: Buffer }
    | { x: string; y: string };

  interface Curve {
    type: CurveTypes;
    n: BN;
    g: Point;
    decodePoint(msg: Buffer | Array<any> | string, enc?: string): Point;
    validate(point: Point): boolean;
  }

  interface Point {
    x: BN;
    y: BN;
    inf: boolean;
    encode(enc: string, compressed?: boolean): Array<number>;
    encodeCompressed(enc?: string): Array<number>;
    isInfinity(): boolean;
    add(k: BN | Number | Point): Point;
    mul(k: BN | Number | Point): Point;
  }

  interface EC {
    curve: Curve;
    genKeyPair(opt?: GenKeyPairOpt): KeyPair;
    keyFromPrivate(priv: string, enc: string): KeyPair;
    keyFromPublic(pub: string, enc: string): KeyPair;
  }

  interface GenKeyPairOpt {
    entropy?: string | Buffer;
    entropyEnc?: HexEnc | Utf8Enc;
    pers?: string | Buffer;
    persEnc?: HexEnc | Utf8Enc;
  }

  interface KeyPair {
    fromPublic(ec: Curve, pub: BN, enc: string): KeyPair;
    fromPrivate(ec: Curve, priv: BN, enc: string): KeyPair;
    // this is broken, but we can't fix it without changing the upstream
    // library; compact is optional, but optional parameters should always
    // _follow_ mandatory ones.
    getPublic(compact: boolean, enc: string): string;
    getPrivate<T = undefined>(enc?: T): T extends HexEnc ? string : BN;
    validate(): { result: boolean; reason: string | null };
  }

  export function ec(curve: string): EC;
}

export = Elliptic;
