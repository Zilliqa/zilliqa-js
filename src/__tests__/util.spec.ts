import elliptic from 'elliptic';
import Signature from 'elliptic/lib/elliptic/ec/signature';
import BN from 'bn.js';
import {addresses} from './address.fixtures';
import {pairs} from './keypairs.fixtures';
import schnorrVectors from './schnorr.fixtures';
import * as util from '../util';
import * as schnorr from '../schnorr';

const secp256k1 = elliptic.ec('secp256k1');

describe('utils', () => {
  it('should be able to generate a valid 32-byte private key', () => {
    const pk = util.generatePrivateKey();

    expect(pk).toHaveLength(64);
    expect(util.verifyPrivateKey(pk)).toBeTruthy();
  });

  it('should recover a public key from a private key', () => {
    pairs.forEach(({private: priv, public: expected}) => {
      const actual = util.getPubKeyFromPrivateKey(priv);
      expect(actual).toEqual(util.compressPublicKey(expected));
    });
  });

  it('should convert a public key to an address', () => {
    pairs.forEach(({public: pub, digest}) => {
      const expected = digest.slice(24);
      const actual = util.getAddressFromPublicKey(pub);

      expect(actual).toHaveLength(40);
      expect(actual).toEqual(expected);
    });
  });

  it('should be able to recover an address from a private key', () => {
    const [pair] = pairs;
    const expected = util.getAddressFromPublicKey(
      util.compressPublicKey(pair.public),
    );
    const actual = util.getAddressFromPrivateKey(pair.private);

    expect(actual).toHaveLength(40);
    expect(actual).toEqual(expected);
  });

  it('should give the same address for a given public or private key', () => {
    pairs.forEach(({private: priv, public: pub}) => {
      const fromPrivateKey = util.getAddressFromPrivateKey(priv);
      const fromPublicKey = util.getAddressFromPublicKey(
        util.compressPublicKey(pub),
      );

      expect(fromPrivateKey).toHaveLength(40);
      expect(fromPublicKey).toHaveLength(40);
      expect(fromPublicKey).toEqual(fromPrivateKey);
    });
  });

  it('should be able to correctly create transaction json', () => {
    const privateKey = pairs[1].private;
    const publicKey = secp256k1
      .keyFromPrivate(privateKey, 'hex')
      .getPublic(true, 'hex');

    const tx = {
      version: 8,
      nonce: 8,
      to: pairs[0].digest.slice(24),
      pubKey: publicKey,
      amount: new BN('888', 10),
      gasPrice: 8,
      gasLimit: 88,
      code: '',
      data: '',
    };

    const {signature} = util.createTransactionJson(privateKey, tx);
    const res = schnorr.verify(
      util.encodeTransaction(tx),
      new Signature({
        r: new BN((signature as string).slice(0, 64), 16),
        s: new BN((signature as string).slice(64), 16),
      }),
      new Buffer(publicKey, 'hex'),
    );

    expect(res).toBeTruthy();
  });

  it('should produce the same results as the C++ keygen util', () => {
    addresses.forEach(({public: pub, private: priv, address}) => {
      const generatedPub = util.getPubKeyFromPrivateKey(priv);
      const addressFromPriv = util.getAddressFromPrivateKey(priv);
      const addressFromPub = util.getAddressFromPrivateKey(priv);

      expect(generatedPub.toUpperCase()).toEqual(pub);
      expect(addressFromPriv.toUpperCase()).toEqual(address);
      expect(addressFromPub.toUpperCase()).toEqual(address);
    });
  });

  it('should sign messages correctly', () => {
    const privateKey = pairs[1].private;
    const publicKey = secp256k1
      .keyFromPrivate(privateKey, 'hex')
      .getPublic(false, 'hex');

    const tx = {
      version: 8,
      nonce: 8,
      to: pairs[0].digest.slice(0, 40),
      pubKey: publicKey,
      amount: new BN('888', 10),
      gasPrice: 8,
      gasLimit: 88,
      code: '',
      data: '',
    };

    const encodedTx = util.encodeTransaction(tx);
    const sig = schnorr.sign(
      encodedTx,
      new Buffer(privateKey, 'hex'),
      new Buffer(publicKey, 'hex'),
    );
    const res = schnorr.verify(encodedTx, sig, new Buffer(publicKey, 'hex'));

    expect(res).toBeTruthy();
  });

  it('should not verify a falsely signed transaction', () => {
    schnorrVectors.forEach(({priv, k}, idx) => {
      const pub = secp256k1.keyFromPrivate(priv, 'hex').getPublic(true, 'hex');
      const badPrivateKey = pairs[0].private;

      const tx = {
        version: 8,
        nonce: 8,
        to: util.getAddressFromPublicKey(pub),
        pubKey: pub,
        amount: new BN('888', 10),
        gasPrice: 8,
        gasLimit: 88,
        code: '',
        data: '',
      };

      const encodedTx = util.encodeTransaction(tx);

      let sig;
      while (!sig) {
        sig = schnorr.trySign(
          encodedTx,
          new BN(new Buffer(badPrivateKey, 'hex')),
          new BN(k),
          new Buffer(''),
          new Buffer(pub, 'hex'),
        );
      }

      const res = schnorr.verify(encodedTx, sig, new Buffer(pub, 'hex'));
      expect(res).toBeFalsy();
    });
  });

  it('should match the C++ Schnorr implementation', () => {
    schnorrVectors.forEach(({msg, priv, pub, k, r, s}) => {
      let sig: Signature | null = null;
      while (!sig) {
        sig = schnorr.trySign(
          new Buffer(msg, 'hex'),
          new BN(new Buffer(priv, 'hex')),
          new BN(k, 16),
          new Buffer(''),
          new Buffer(pub, 'hex'),
        );
      }

      const res = schnorr.verify(
        new Buffer(msg, 'hex'),
        sig,
        new Buffer(pub, 'hex'),
      );

      expect(sig.r.toString('hex', 64).toUpperCase()).toEqual(r);
      expect(sig.s.toString('hex', 64).toUpperCase()).toEqual(s);
      expect(res).toBeTruthy();
    });
  });
});
