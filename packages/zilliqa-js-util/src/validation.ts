import BN from 'bn.js';

export const isAddress = (address: string) => {
  return isByteString(address, 40);
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

export const matchesObject = <T extends Object>(
  x: unknown,
  test: { [key: string]: Validator[] },
): x is T => {
  if (isPlainObject(x)) {
    for (var key in test) {
      for (var i = 0; i < test[key].length; i++) {
        const value = x[key];

        if (typeof value === 'undefined') {
          if (test[key][i].required) {
            throw new Error('Key not found: ' + key);
          }

          continue;
        }

        if (typeof test[key][i] !== 'function')
          throw new Error('Validator is not a function');

        if (!test[key][i](x[key]))
          throw new Error('Validation failed for ' + key);
      }
    }
  }

  return true;
};
