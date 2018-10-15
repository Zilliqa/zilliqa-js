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

export interface TxReceipt {
  success: 'true' | 'false';
  cumulative_gas: number;
}

export interface TxIncluded {
  ID: string;
  receipt: TxReceipt;
}

export interface TxParams {
  version: number;
  to: string;
  amount: BN;
  gasPrice: BN;
  gasLimit: BN;

  id?: string;
  code?: string;
  data?: string;
  receipt?: TxReceipt;
  nonce?: number;
  pubKey?: string;
  signature?: string;
}
