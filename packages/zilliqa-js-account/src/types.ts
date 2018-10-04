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
  to: string;
  amount: BN;
  gasPrice: number;
  gasLimit: number;

  id?: string;
  code?: string;
  data?: string;
  receipt?: {success: boolean; cumulative_gas: number};
  nonce?: number;
  pubKey?: string;
  signature?: string;
}
