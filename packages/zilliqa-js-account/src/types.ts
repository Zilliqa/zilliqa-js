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

export interface TxCreated {
  Info: string;
  TranID: string;
  ContractAddress?: string;
}

export interface TxRejected {
  Error: string;
}

export interface TxIncluded {
  ID: string;
  receipt: TxReceipt;
}

export interface TxReceipt {
  success: boolean;
  cumulative_gas: number;
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
