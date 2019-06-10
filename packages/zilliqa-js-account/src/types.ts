import { BN, Long } from '@zilliqa-js/util';
import { TransactionReceiptObj } from '@zilliqa-js/core';

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

export type TxReceipt = TransactionReceiptObj<number>;

export interface TxIncluded {
  ID: string;
  receipt: TransactionReceiptObj;
}

export interface TxParams {
  version: number;
  toAddr: string;
  amount: BN;
  gasPrice: BN;
  gasLimit: Long;

  code?: string;
  data?: string;
  receipt?: TxReceipt;
  nonce?: number;
  pubKey?: string;
  signature?: string;
}

export enum TransactionEvents {
  id = 'id',
  error = 'error',
  confirm = 'confirm',
  receipt = 'receipt',
  track = 'track',
}
