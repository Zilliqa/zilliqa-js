export type KDF = 'pbkdf2' | 'scrypt';

export type PBKDF2Params = {
  salt: string;
  dklen: number;
  c: number;
};

export type ScryptParams = {
  salt: string;
  dklen: number;
  n: number;
  r: number;
  p: number;
};

export type KDFParams = PBKDF2Params | ScryptParams;

export interface KeystoreV3 {
  address: string;
  crypto: {
    cipher: string;
    cipherparams: {
      iv: string;
    };
    ciphertext: string;
    kdf: KDF;
    kdfparams: KDFParams;
    mac: string;
  };
  id: string;
  version: 3;
}
