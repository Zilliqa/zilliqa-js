import BN from 'bn.js';
import { randomBytes } from 'crypto';
import elliptic from 'elliptic';

import { pairs } from './keypairs.fixtures';
import schnorrVectors from './schnorr.fixtures.json';

import * as schnorr from '../src/schnorr';
import { Signature } from '../src/signature';

const secp256k1 = elliptic.ec('secp256k1');

describe('schnorr', () => {
  it('should fail for bad signatures', () => {
    schnorrVectors.slice(0, 100).forEach(({ priv, k }, idx) => {
      const pub = secp256k1.keyFromPrivate(priv, 'hex').getPublic(true, 'hex');
      const badPrivateKey = pairs[0].private;

      const msg = randomBytes(128);

      let sig;
      while (!sig) {
        sig = schnorr.trySign(
          msg,
          new BN(k),
          new BN(Buffer.from(badPrivateKey, 'hex')),
          Buffer.from(pub, 'hex'),
        );
      }

      const res = schnorr.verify(msg, sig, Buffer.from(pub, 'hex'));
      expect(res).toBeFalsy();
    });
  });

  it('should not verify invalid public keys', () => {
    // invalid point for secp256k1
    const x =
      'c70dc2f79d407ae3800098eea06c50cd80948d15d209a73df6f6c2b31bb247d4';
    const y =
      '07132a5e43e331ac0b4cbec1d7318add7d25533d0dbee5cd5ded9fe9ddb4248a';
    const pubKey = '04' + x + y;

    // signature over the string 'test', for the invalid point (x,y) above
    const r =
      'e5d98c86e8b85e4c41d47c4ed50219adad544c57c1f75408477c475abcc5e7bc';
    const s =
      'de79ea11594f3dd3882fcc69a8413fa626a76df639a01c72dde9dc2d63c6d894';
    const signature = new Signature({ r, s });

    const res = () =>
      schnorr.verify(
        Buffer.from('test'),
        signature,
        Buffer.from(pubKey, 'hex'),
      );

    expect(res).toThrow('Invalid public key');
  });

  it('should match the C++ Schnorr implementation', () => {
    schnorrVectors.slice(0, 100).forEach(({ msg, priv, pub, k, r, s }) => {
      let sig: Signature | null = null;
      while (!sig) {
        sig = schnorr.trySign(
          Buffer.from(msg, 'hex'),
          new BN(k, 16),
          new BN(Buffer.from(priv, 'hex')),
          Buffer.from(pub, 'hex'),
        );
      }

      const res = schnorr.verify(
        Buffer.from(msg, 'hex'),
        sig,
        Buffer.from(pub, 'hex'),
      );

      expect(sig.r.eq(new BN(r, 16))).toBe(true);
      expect(sig.s.eq(new BN(s, 16))).toBe(true);
      expect(res).toBe(true);
    });
  });
});
