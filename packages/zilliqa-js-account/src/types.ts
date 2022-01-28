//  Copyright (C) 2018 Zilliqa
//
//  This file is part of zilliqa-js
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU General Public License for more details.
//
//  You should have received a copy of the GNU General Public License
//  along with this program.  If not, see <https://www.gnu.org/licenses/>.

import { BN, Long } from '@zilliqa-js/util';
import { TransactionReceiptObj } from '@zilliqa-js/core';

export enum TxStatus {
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

export enum TxEventName {
  Error = 'error',
  Receipt = 'receipt',
  Track = 'track',
}
