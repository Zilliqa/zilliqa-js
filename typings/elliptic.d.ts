// Copyright (c) 2018 Zilliqa
// This source code is being disclosed to you solely for the purpose of your participation in
// testing Zilliqa. You may view, compile and run the code for that purpose and pursuant to
// the protocols and algorithms that are programmed into, and intended by, the code. You may
// not do anything else with the code without express permission from Zilliqa Research Pte. Ltd.,
// including modifying or publishing the code (or any part of it), and developing or forming
// another public or private blockchain network. This source code is provided ‘as is’ and no
// warranties are given as to title or non-infringement, merchantability or fitness for purpose
// and, to the extent permitted by law, all liability for your use of the code is disclaimed.
declare module 'elliptic' {
  import BN from 'bn.js';

  namespace elliptic {
    type CurveTypes = 'short' | 'edwards' | 'mont';
    type PrivateKey =
      | string
      | Buffer
      | {x: Buffer; y: Buffer}
      | {x: string; y: string};

    interface Curve {
      type: CurveTypes;
      n: BN;
      g: Point;
      decodePoint(msg: Buffer | Array<any> | string, enc?: string): Point;
    }

    interface Point {
      x: BN;
      y: BN;
      inf: boolean;
      encode(enc: string, compressed?: boolean): Array<number>;
      encodeCompressed(enc?: string): Array<number>;
      add(k: BN | Number | Point): Point;
      mul(k: BN | Number | Point): Point;
    }

    interface EC {
      curve: Curve;
      keyFromPrivate(priv: string, enc: string): KeyPair;
      keyFromPublic(pub: string, enc: string): KeyPair;
    }

    interface KeyPair {
      fromPublic(ec: Curve, pub: BN, enc: string): KeyPair;
      fromPrivate(ec: Curve, priv: BN, enc: string): KeyPair;
      // this is broken, but we can't fix it without changing the upstream
      // library; compact is optional, but optional parameters should always
      // _follow_ mandatory ones.
      getPublic(compact: boolean, enc: string): string;
      getPrivate(enc: string): Array<number>;
      validate(): { result: boolean; reason: string | null };
    }

    export function ec(curve: string): EC;
  }

  export = elliptic;
}
