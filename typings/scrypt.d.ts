declare module 'scrypt.js' {
  export default function scrypt(
    key: Buffer,
    salt: Buffer,
    n: number,
    r: number,
    p: number,
    dklen: number,
    progressCB?: (prog: any) => void,
  ): Buffer;
}
