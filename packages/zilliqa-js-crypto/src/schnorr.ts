import elliptic from 'elliptic';
import BN from 'bn.js';
import hashjs from 'hash.js';
import DRBG from 'hmac-drbg';

import { randomBytes } from './random';
import { Signature } from './signature';

const curve = elliptic.ec('secp256k1').curve;
// Public key is a point (x, y) on the curve.
// Each coordinate requires 32 bytes.
// In its compressed form it suffices to store the x co-ordinate
// and the sign for y.
// Hence a total of 33 bytes.
const PUBKEY_COMPRESSED_SIZE_BYTES = 33;
// Personalization string used for HMAC-DRBG instantiation.
const ALG = Buffer.from('Schnorr+SHA256  ', 'ascii');
// The length in bytes of the string above.
const ALG_LEN = 16;
// The length in bytes of entropy inputs to HMAC-DRBG
const ENT_LEN = 32;

/**
 * Hash (r | M).
 * @param {Buffer} msg
 * @param {BN} r
 *
 * @returns {Buffer}
 */

export const hash = (q: BN, pubkey: Buffer, msg: Buffer) => {
  const sha256 = hashjs.sha256();
  const totalLength = PUBKEY_COMPRESSED_SIZE_BYTES * 2 + msg.byteLength; // 33 q + 33 pubkey + variable msgLen
  const Q = q.toArrayLike(Buffer, 'be', 33);
  const B = Buffer.allocUnsafe(totalLength);

  Q.copy(B, 0);
  pubkey.copy(B, 33);
  msg.copy(B, 66);

  return new BN(sha256.update(B).digest('hex'), 16);
};

/**
 * sign
 *
 * @param {Buffer} msg
 * @param {Buffer} key
 * @param {Buffer} pubkey
 *
 * @returns {Signature}
 */
export const sign = (
  msg: Buffer,
  privKey: Buffer,
  pubKey: Buffer,
): Signature => {
  const prv = new BN(privKey);
  const drbg = getDRBG();
  const len = curve.n.byteLength();

  let sig;
  while (!sig) {
    const k = new BN(drbg.generate(len));
    sig = trySign(msg, k, prv, pubKey);
  }

  return sig;
};

/**
 * trySign
 *
 * @param {Buffer} msg - the message to sign over
 * @param {BN} k - output of the HMAC-DRBG
 * @param {BN} privateKey - the private key
 * @param {Buffer} pubKey - the public key
 *
 * @returns {Signature | null =>}
 */
export const trySign = (
  msg: Buffer,
  k: BN,
  privKey: BN,
  pubKey: Buffer,
): Signature | null => {
  if (privKey.isZero()) {
    throw new Error('Bad private key.');
  }

  if (privKey.gte(curve.n)) {
    throw new Error('Bad private key.');
  }

  // 1a. check that k is not 0
  if (k.isZero()) {
    return null;
  }
  // 1b. check that k is < the order of the group
  if (k.gte(curve.n)) {
    return null;
  }

  // 2. Compute commitment Q = kG, where g is the base point
  const Q = curve.g.mul(k);
  // convert the commitment to octets first
  const compressedQ = new BN(Q.encodeCompressed());

  // 3. Compute the challenge r = H(Q || pubKey || msg)
  // mod reduce the r value by the order of secp256k1, n
  const r = hash(compressedQ, pubKey, msg).umod(curve.n);
  const h = r.clone();

  if (h.isZero()) {
    return null;
  }

  if (h.eq(curve.n)) {
    return null;
  }

  // 4. Compute s = k - r * prv
  // 4a. Compute r * prv
  let s = h.imul(privKey).umod(curve.n);
  // 4b. Compute s = k - r * prv mod n
  s = k.isub(s).umod(curve.n);

  if (s.isZero()) {
    return null;
  }

  return new Signature({ r, s });
};

/**
 * Verify signature.
 *
 * @param {Buffer} msg
 * @param {Buffer} signature
 * @param {Buffer} key
 *
 * @returns {boolean}
 *
 * 1. Check if r,s is in [1, ..., order-1]
 * 2. Compute Q = sG + r*kpub
 * 3. If Q = O (the neutral point), return 0;
 * 4. r' = H(Q, kpub, m)
 * 5. return r' == r
 */
export const verify = (msg: Buffer, signature: Signature, key: Buffer) => {
  const sig = new Signature(signature);

  if (sig.s.gte(curve.n)) {
    throw new Error('Invalid S value.');
  }

  if (sig.r.gt(curve.n)) {
    throw new Error('Invalid R value.');
  }

  const kpub = curve.decodePoint(key);
  if (!curve.validate(kpub)) {
    throw new Error('Invalid public key');
  }

  const l = kpub.mul(sig.r.umod(curve.n));
  const r = curve.g.mul(sig.s.umod(curve.n));

  const Q = l.add(r);
  const compressedQ = new BN(Q.encodeCompressed());

  const r1 = hash(compressedQ, key, msg).umod(curve.n);

  if (r1.gte(curve.n)) {
    throw new Error('Invalid hash.');
  }

  if (r1.isZero()) {
    throw new Error('Invalid hash.');
  }

  return r1.eq(sig.r);
};

export const toSignature = (serialised: string): Signature => {
  const r = serialised.slice(0, 64);
  const s = serialised.slice(64);

  return new Signature({ r, s });
};

/**
 * Instantiate an HMAC-DRBG.
 *
 * @param {Buffer} entropy
 *
 * @returns {DRBG}
 */
const getDRBG = () => {
  const entropy = randomBytes(ENT_LEN);
  const nonce = randomBytes(ENT_LEN);
  const pers = Buffer.allocUnsafe(ALG_LEN + ENT_LEN);

  Buffer.from(randomBytes(ENT_LEN)).copy(pers, 0);
  ALG.copy(pers, ENT_LEN);

  return new DRBG({
    hash: hashjs.sha256,
    entropy,
    nonce,
    pers,
  });
};
