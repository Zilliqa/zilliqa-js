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

  function pbkdf2Sync(
    passphrase: Buffer,
    salt: Buffer,
    n: number,
    dklen: number,
    digest: Digest,
  ): Buffer;

  function pbkdf2(
    passphrase: Buffer,
    salt: Buffer,
    n: number,
    dklen: number,
    digest: Digest,
    cb: (err: any, derivedKey: Buffer) => void,
  ): void;

  interface Exported {
    pbkdf2: typeof pbkdf2;
    pbkdf2Sync: typeof pbkdf2Sync;
  }

  var exports: Exported;

  export = exports;
}
