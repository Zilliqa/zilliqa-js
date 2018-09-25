declare module 'pbkdf2' {
  type Digest =
    | 'md5'
    | 'sha1'
    | 'sha224'
    | 'sha256'
    | 'sha384'
    | 'sha512'
    | 'rmd160'
    | 'ripemd160';

  export function pbkdf2sync(
    passphrase: Buffer,
    salt: Buffer,
    n: number,
    dklen: number,
    digest: Digest,
  ): Buffer;

  export function pbkdf2(
    passphrase: Buffer,
    salt: Buffer,
    n: number,
    dklen: number,
    digest: Digest,
    cb: (err: any, derivedKey: Buffer) => void,
  ): void;
}
