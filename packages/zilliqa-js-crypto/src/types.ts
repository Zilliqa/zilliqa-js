export type KDF = 'pbkdf2' | 'scrypt';

export interface KDFParams {
  salt: string;
  n: number;
  r: number;
  p: number;
  dklen: number;
}

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
