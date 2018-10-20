import BN from 'bn.js';
import {randomBytes} from 'crypto';
import elliptic from 'elliptic';

import {pairs} from './keypairs.fixtures';
import schnorrVectors from './schnorr.fixtures';

import * as crypto from '../src/index';
import * as schnorr from '../src/schnorr';
import Signature from '../src/signature';

const secp256k1 = elliptic.ec('secp256k1');

describe('schnorr', () => {
  it('should fail for bad signatures', () => {
    schnorrVectors.forEach(({priv, k}, idx) => {
      const pub = secp256k1.keyFromPrivate(priv, 'hex').getPublic(true, 'hex');
      const badPrivateKey = pairs[0].private;

      const msg = randomBytes(128);

      let sig;
      while (!sig) {
        sig = schnorr.trySign(
          msg,
          new BN(Buffer.from(badPrivateKey, 'hex')),
          new BN(k),
          Buffer.from(pub, 'hex'),
        );
      }

      const res = schnorr.verify(msg, sig, Buffer.from(pub, 'hex'));
      expect(res).toBeFalsy();
    });
  });

  it('should match the C++ Schnorr implementation', () => {
    schnorrVectors.forEach(({msg, priv, pub, k, r, s}) => {
      let sig: Signature | null = null;
      while (!sig) {
        sig = schnorr.trySign(
          Buffer.from(msg, 'hex'),
          new BN(Buffer.from(priv, 'hex')),
          new BN(k, 16),
          Buffer.from(pub, 'hex'),
        );
      }

      const res = schnorr.verify(
        Buffer.from(msg, 'hex'),
        sig,
        Buffer.from(pub, 'hex'),
      );

      expect(sig.r.toString('hex', 64).toUpperCase()).toEqual(r);
      expect(sig.s.toString('hex', 64).toUpperCase()).toEqual(s);
      expect(res).toBeTruthy();
    });
  });
});
