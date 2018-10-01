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

export interface TxParams {
  version: number;
  nonce: number;
  to: string;
  amount: BN;
  pubKey: string;
  gasPrice: number;
  gasLimit: number;
  code?: string;
  data?: string;
  signature?: string;
  status: TxStatus;
}
