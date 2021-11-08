declare module 'elliptic/lib/elliptic/ec/signature.js' {
  class Signature {
    r: any;
    s: any;
    recoveryParam: any;
    toDER: any;
    constructor({ r, s }: { r: any; s: any; [key: string]: any });
  }
  export = Signature;
}
