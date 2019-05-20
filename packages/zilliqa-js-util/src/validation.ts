import BN from 'bn.js';
import Long from 'long';

export const isAddress = (address: string) => {
  return isByteString(address, 40);
};

export const isBech32 = (raw: string) => {
  return !!raw.match(/^zil1[qpzry9x8gf2tvdw0s3jn54khce6mua7l]{38}/);
};

export const isBase58 = (raw: string) => {
  return !!raw.match(
    /^[1-9ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]+$/,
  );
};

export const isPrivateKey = (privateKey: string) => {
  return isByteString(privateKey, 64);
};

export const isPubKey = (pubKey: string) => {
  return isByteString(pubKey, 66);
};

export const isSignature = (sig: string) => {
  return isByteString(sig, 128);
};

export const isByteString = (str: string, len: number) => {
  return !!str.replace('0x', '').match(`^[0-9a-fA-F]{${len}}$`);
};

export const isNumber = (x: unknown): x is number => {
  return typeof x === 'number';
};

export const isBN = (x: unknown): x is BN => {
  return BN.isBN(x);
};

export const isLong = (x: unknown): x is Long => {
  return Long.isLong(x);
};

export const isString = (x: unknown): x is string => {
  return typeof x === 'string';
};

export const isPlainObject = (x: unknown): x is { [key: string]: any } => {
  if (typeof x === 'object' && x !== null) {
    const proto = Object.getPrototypeOf(x);
    return proto === Object.prototype || proto === null;
  }

  return false;
};

const PRAGMA_REQUIRED = '@@ZJS_REQUIRED@@';

export interface Validator extends Function {
  required?: typeof PRAGMA_REQUIRED;
}

export const required = <T extends Function>(fn: T): Validator => {
  if (typeof fn === 'function') {
    return Object.defineProperty(fn, 'required', {
      value: PRAGMA_REQUIRED,
    });
  }

  throw new Error('fn is not a function');
};

export const matchesObject = <T extends object>(
  x: unknown,
  test: { [key: string]: Validator[] },
): x is T => {
  if (isPlainObject(x)) {
    for (const key in test) {
      if (test.hasOwnProperty(key)) {
        for (const tester of test[key]) {
          const value = x[key];

          if (typeof value === 'undefined' && tester.required) {
            throw new Error('Key not found: ' + key);
          } else {
            continue;
          }

          if (typeof tester !== 'function') {
            throw new Error('Validator is not a function');
          }

          if (!tester(value)) {
            throw new Error('Validation failed for ' + key);
          }
        }
      }
    }
  }

  return true;
};
