declare module 'aes-js' {
  export class Counter {
    constructor(iv: Buffer);
    setValue(value: number): void;
    setBytes(bytes: Array<number> | Buffer | string): void;
    increment(): void;
  }

  class CTR {
    constructor(derivedKey: Buffer, iv: Counter);
    encrypt(bytes: Buffer): Uint8Array;
    decrypt(bytes: Buffer): Uint8Array;
  }

  export const ModeOfOperation: { ctr: typeof CTR };
}
