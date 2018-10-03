import BN from 'bn.js';

export interface Account {
  address: string;
  privateKey: string;
  publicKey: string;
}

export const enum TxStatus {
  Initialised,
  Pending,
  Confirmed,
  Rejected,
}

export interface BaseTx {
  version: number;
  nonce: number;
  to: string;
  amount: BN;
  gasPrice: number;
  gasLimit: number;
  code?: string;
  data?: string;
  pubKey?: string;
  signature?: string;
}

