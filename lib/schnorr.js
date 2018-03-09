/*!
 * schnorr.js - schnorr signatures for bcoin
 * Copyright (c) 2014-2017, Christopher Jeffrey (MIT License).
 * https://github.com/bcoin-org/bcoin
 */

'use strict';

const assert = require('assert');
const elliptic = require('elliptic');
const Signature = require('elliptic/lib/elliptic/ec/signature');
const BN = require('bn.js');
const DRBG = require('bcrypto/lib/drbg');
const sha256 = require('bcrypto/lib/sha256');
const curve = elliptic.ec('secp256k1').curve;
const schnorr = exports;

/**
 * Hash (r | M).
 * @param {Buffer} msg
 * @param {BN} r
 * @returns {Buffer}
 */

schnorr.hash = function hash(q, pubkey, msg) {
  let totalLength = 66 + msg.byteLength // 33 q + 33 pubkey + variable msgLen
  let Q = q.toArrayLike(Buffer, 'be', 33);
  const B = Buffer.allocUnsafe(totalLength);

  Q.copy(B, 0);
  pubkey.copy(B, 33);
  msg.copy(B, 66);

  return new BN(sha256.digest(B));
};

/**
 * Sign message.
 * @private
 * @param {Buffer} msg
 * @param {BN} priv
 * @param {BN} k
 * @param {Buffer} pn
 * @returns {Signature|null}
 */

schnorr.trySign = function trySign(msg, prv, k, pn, pubKey) {
  if (prv.isZero())
    throw new Error('Bad private key.');

  if (prv.gte(curve.n))
    throw new Error('Bad private key.');

  if (k.isZero())
    return null;

  if (k.gte(curve.n))
    return null;

  let Q = curve.g.mul(k);
  let compressedQ = new BN(Q.encodeCompressed());

  const r = schnorr.hash(compressedQ, pubKey, msg);
  const h = r.clone();

  if (h.isZero())
    return null;

  if (h.gte(curve.n))
    return null;

  let s = h.imul(prv);
  s = k.isub(s);
  s = s.umod(curve.n);

  if (s.isZero())
    return null;

  return new Signature({ r: r, s: s });
};

/**
 * Sign message.
 * @param {Buffer} msg
 * @param {Buffer} key
 * @param {Buffer} pubNonce
 * @returns {Signature}
 */

schnorr.sign = function sign(msg, key, pubkey, pubNonce) {
  const prv = new BN(key);
  const drbg = schnorr.drbg(msg, key, pubNonce);
  const len = curve.n.byteLength();

  let pn;
  if (pubNonce)
    pn = curve.decodePoint(pubNonce);

  let sig;
  while (!sig) {
    const k = new BN(drbg.generate(len));
    sig = schnorr.trySign(msg, prv, k, pn, pubkey);
  }

  return sig;
};

/**
 * Verify signature.
 * @param {Buffer} msg
 * @param {Buffer} signature
 * @param {Buffer} key
 * @returns {Buffer}
 */

schnorr.verify = function verify(msg, signature, key) {
  const sig = new Signature(signature);

  if (sig.s.gte(curve.n))
    throw new Error('Invalid S value.');

  if (sig.r.gt(curve.n))
    throw new Error('Invalid R value.');

  const kpub = curve.decodePoint(key);
  const l = kpub.mul(sig.r);
  const r = curve.g.mul(sig.s);

  let Q = l.add(r);
  let compressedQ = new BN(Q.encodeCompressed());

  const r1 = schnorr.hash(compressedQ, key, msg);

  if (r1.gte(curve.n))
    throw new Error('Invalid hash.');

  if (r1.isZero())
    throw new Error('Invalid hash.');

  return r1.eq(sig.r);
};

/**
 * Schnorr personalization string.
 * @const {Buffer}
 */

schnorr.alg = Buffer.from('Schnorr+SHA256  ', 'ascii');

/**
 * Instantiate an HMAC-DRBG.
 * @param {Buffer} msg
 * @param {Buffer} priv
 * @param {Buffer} data
 * @returns {DRBG}
 */

schnorr.drbg = function drbg(msg, priv, data) {
  const pers = Buffer.allocUnsafe(48);

  pers.fill(0);

  if (data) {
    assert(data.length === 32);
    data.copy(pers, 0);
  }

  schnorr.alg.copy(pers, 32);

  return new DRBG(sha256, 32, priv, msg, pers);
};

/**
 * Generate pub+priv nonce pair.
 * @param {Buffer} msg
 * @param {Buffer} priv
 * @param {Buffer} data
 * @returns {Buffer}
 */

schnorr.generateNoncePair = function generateNoncePair(msg, priv, data) {
  const drbg = schnorr.drbg(msg, priv, data);
  const len = curve.n.byteLength();

  let k = null;

  for (;;) {
    k = new BN(drbg.generate(len));

    if (k.isZero())
      continue;

    if (k.gte(curve.n))
      continue;

    break;
  }

  return Buffer.from(curve.g.mul(k).encode('array', true));
};
