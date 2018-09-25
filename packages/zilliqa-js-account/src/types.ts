import BN from 'bn.js';

export interface Account {
  address: string;
  privateKey: string;
  publicKey: string;
}

export interface Transaction {
  version: number;
  nonce: number;
  to: string;
  amount: BN;
  pubKey: string;
  gasPrice: number;
  gasLimit: number;
  code: string;
  data: string;
  signature?: string;
}
