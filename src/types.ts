import BN from 'bn.js';

export interface TxDetails {
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
