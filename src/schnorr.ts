/*!
 * Copyright (c) 2018 Zilliqa 
 * This source code is being disclosed to you solely for the purpose of your participation in 
 * testing Zilliqa. You may view, compile and run the code for that purpose and pursuant to 
 * the protocols and algorithms that are programmed into, and intended by, the code. You may 
 * not do anything else with the code without express permission from Zilliqa Research Pte. Ltd., 
 * including modifying or publishing the code (or any part of it), and developing or forming 
 * another public or private blockchain network. This source code is provided ‘as is’ and no 
 * warranties are given as to title or non-infringement, merchantability or fitness for purpose 
 * and, to the extent permitted by law, all liability for your use of the code is disclaimed. 
 * Some programs in this code are governed by the GNU General Public License v3.0 (available at 
 * https://www.gnu.org/licenses/gpl-3.0.en.html) (‘GPLv3’). The programs that are governed by 
 * GPLv3.0 are those programs that are located in the folders src/depends and tests/depends 
 * and which include a reference to GPLv3 in their program files.
 * 
 * This implementation of Schnorr is modified from the following 
 * schnorr.js - schnorr signatures for bcoin
 * Copyright (c) 2014-2017, Christopher Jeffrey (MIT License).
 * https://github.com/bcoin-org/bcoin
 */
import assert from 'bsert';
import elliptic from 'elliptic';
import BN from 'bn.js';
import DRBG from 'hmac-drbg';
import sha256 from 'crypto-js/sha256';
import Signature from 'elliptic/lib/elliptic/ec/signature';

const curve = elliptic.ec('secp256k1').curve;

/**
 * Hash (r | M).
 * @param {Buffer} msg
 * @param {BN} r
 *
 * @returns {Buffer}
 */

export const hash = (q: BN, pubkey: Buffer, msg: Buffer) => {
  const totalLength = 66 + msg.byteLength; // 33 q + 33 pubkey + variable msgLen
  const Q = q.toArrayLike(Buffer, 'be', 33);
  const B = Buffer.allocUnsafe(totalLength);

  Q.copy(B, 0);
  pubkey.copy(B, 33);
  msg.copy(B, 66);

  return new BN(sha256.digest(B));
};

/**
 * Sign message.
 * @param {Buffer} msg
 * @param {Buffer} key
 * @param {Buffer} pubNonce
 * @returns {Signature}
 */
export const sign = (
  msg: Buffer,
  key: Buffer,
  pubkey: Buffer,
  pubNonce?: Buffer,
) => {
  const prv = new BN(key);
  const drbg = getDRBG(msg, key, pubNonce);
  const len = curve.n.byteLength();

  let pn;
  if (pubNonce) pn = curve.decodePoint(pubNonce);

  let sig;
  while (!sig) {
    const k = new BN(drbg.generate(len));
    sig = trySign(msg, prv, k, pn, pubkey);
  }

  return sig;
};

/**
 * Sign message.
 *
 * @param {Buffer} msg
 * @param {BN} priv
 * @param {BN} k
 * @param {Buffer} pn
 *
 * @returns {Signature|null}
 */
const trySign = (msg: Buffer, prv: BN, k: BN, pn: Buffer, pubKey: Buffer) => {
  if (prv.isZero()) throw new Error('Bad private key.');

  if (prv.gte(curve.n)) throw new Error('Bad private key.');

  if (k.isZero()) return null;

  if (k.gte(curve.n)) return null;

  const Q = curve.g.mul(k);
  const compressedQ = new BN(Q.encodeCompressed());

  const Q = curve.g.mul(k);
  const compressedQ = new BN(Q.encodeCompressed());

  const r = hash(compressedQ, pubKey, msg);
  const h = r.clone();

  if (h.isZero()) return null;

  if (h.gte(curve.n)) return null;

  let s = h.imul(prv);
  s = k.isub(s);
  s = s.umod(curve.n);

  if (s.isZero()) return null;

  return new Signature({ r, s });
};

/**
 * Verify signature.
 * @param {Buffer} msg
 * @param {Buffer} signature
 * @param {Buffer} key
 * @returns {Buffer}
 */

export const verify = (msg: Buffer, signature: Buffer, key: Buffer) => {
  const sig = new Signature(signature);

  if (sig.s.gte(curve.n)) throw new Error('Invalid S value.');

  if (sig.r.gt(curve.n)) throw new Error('Invalid R value.');

  const kpub = curve.decodePoint(key);
  const l = kpub.mul(sig.r);
  const r = curve.g.mul(sig.s);

  const Q = l.add(r);
  const compressedQ = new BN(Q.encodeCompressed());

  const r1 = hash(compressedQ, key, msg);

  if (r1.gte(curve.n)) throw new Error('Invalid hash.');

  if (r1.isZero()) throw new Error('Invalid hash.');

  return r1.eq(sig.r);
};

/**
 * Schnorr personalization string.
 * @const {Buffer}
 */

export const alg = Buffer.from('Schnorr+SHA256  ', 'ascii');

/**
 * Instantiate an HMAC-DRBG.
 *
 * @param {Buffer} msg
 * @param {Buffer} priv
 * @param {Buffer} data
 *
 * @returns {DRBG}
 */

export const getDRBG = (msg: Buffer, priv: Buffer, data?: Buffer) => {
  const pers = Buffer.allocUnsafe(48);

  pers.fill(0);

  if (data) {
    assert(data.length === 32);
    data.copy(pers, 0);
  }

  alg.copy(pers, 32);

  return new DRBG(sha256, priv, msg, pers);
};

/**
 * Generate pub+priv nonce pair.
 * @param {Buffer} msg
 * @param {Buffer} priv
 * @param {Buffer} data
 * @returns {Buffer}
 */

export const generateNoncePair = (msg: Buffer, priv: Buffer, data: Buffer) => {
  const drbg = getDRBG(msg, priv, data);
  const len = curve.n.byteLength();

  let k = new BN(drbg.generate(len));

  while (k.isZero() && k.gte(curve.n)) {
    k = new BN(drbg.generate(len));
  }

  return Buffer.from(curve.g.mul(k).encode('array', true));
};
