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
      keyFromPrivate(priv: string, enc: string): KeyPair;
      keyFromPublic(pub: BN, enc: string): KeyPair;
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
