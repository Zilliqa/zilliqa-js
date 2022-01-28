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

import { RPCResponse } from './net';
import { Middleware } from './util';

export type Subscriber = (event: any) => void;
export type Subscribers = Map<SubscriptionToken, Subscriber>;
type SubscriptionToken = symbol;

export interface Provider {
  middleware: Middleware;
  // TODO: strict typing when we have a better idea of how to generalise the
  // payloads sent to lookup nodes - protobuf?
  send<R = any, E = string>(
    method: string,
    ...params: any[]
  ): Promise<RPCResponse<R, E>>;

  sendBatch<R = any, E = string>(
    method: string,
    ...params: any[]
  ): Promise<RPCResponse<R, E>>;

  subscribe?(event: string, subscriber: Subscriber): symbol;

  unsubscribe?(token: symbol): void;
}

export abstract class Signer {
  abstract sign(payload: Signable): Promise<Signable>;
}

export interface Signable {
  bytes: Buffer;
}

/**
 * ZilliqaModule
 *
 * This interface must be implemented by all top-level modules.
 */
export interface ZilliqaModule {
  provider: Provider;
  signer: Signer;
}

export interface BlockchainInfo {
  NumPeers: number;
  NumTxBlocks: string;
  NumDSBlocks: string;
  NumTransactions: string;
  TransactionRate: number;
  TxBlockRate: number;
  DSBlockRate: number;
  CurrentMiniEpoch: string;
  CurrentDSEpoch: string;
  NumTxnsDSEpoch: string;
  NumTxnsTxEpoch: string;
  ShardingStructure: ShardingStructure;
}

export interface ShardingStructure {
  NumPeers: number[];
}

export interface TransactionObj {
  ID: string;
  version: string;
  nonce: string;
  toAddr: string;
  amount: string;
  code: string;
  data: string;
  gasPrice: string;
  gasLimit: string;
  signature: string;
  senderPubKey: string;
  receipt: TransactionReceiptObj;
}

export interface TransactionStatusObj {
  ID: string;
  _id: StatusID;
  amount: string;
  epochInserted: string;
  epochUpdated: string;
  gasLimit: string;
  gasPrice: string;
  lastModified: string;
  modificationState: number;
  nonce: string;
  senderAddr: string;
  signature: string;
  status: number;
  success: boolean;
  toAddr: string;
  version: string;
  statusMessage: string;
}

export interface StatusID {
  $oid: string;
}

export interface DsBlockHeader {
  BlockNum: string;
  Difficulty: number;
  DifficultyDS: number;
  GasPrice: string;
  LeaderPubKey: string;
  PoWWinners: string[];
  PrevHash: string;
  // unix epoch
  Timestamp: string;
}

export interface DsBlockObj {
  header: DsBlockHeader;
  signature: string;
}

interface BlockShort {
  BlockNum: number;
  Hash: string;
}

export interface BlockList {
  data: BlockShort[];
  maxPages: number;
}

export interface TxBlockHeader {
  BlockNum: string;
  DSBlockNum: string;
  GasLimit: string;
  GasUsed: string;
  MbInfoHash: string;
  MinerPubKey: string;
  NumMicroBlocks: number;
  NumPages: number;
  NumTxns: number;
  PrevBlockHash: string;
  Rewards: string;
  StateDeltaHash: string;
  StateRootHash: string;
  Timestamp: string;
  TxnFees: string;
  Version: number;
}

export interface MicroBlockInfoObj {
  MicroBlockHash: string;
  MicroBlockShardId: number;
  MicroBlockTxnRootHash: string;
}

export interface TxBlockObj {
  body: {
    BlockHash: string;
    HeaderSign: string;
    MicroBlockInfos: MicroBlockInfoObj[];
  };
  header: TxBlockHeader;
}

export interface TxList {
  number: number;
  TxnHashes: string[];
}

export enum TransactionError {
  CHECKER_FAILED = 0,
  RUNNER_FAILED,
  BALANCE_TRANSFER_FAILED,
  EXECUTE_CMD_FAILED,
  EXECUTE_CMD_TIMEOUT,
  NO_GAS_REMAINING_FOUND,
  NO_ACCEPTED_FOUND,
  CALL_CONTRACT_FAILED,
  CREATE_CONTRACT_FAILED,
  JSON_OUTPUT_CORRUPTED,
  CONTRACT_NOT_EXIST,
  STATE_CORRUPTED,
  LOG_ENTRY_INSTALL_FAILED,
  MESSAGE_CORRUPTED,
  RECEIPT_IS_NULL,
  MAX_DEPTH_REACHED,
  CHAIN_CALL_DIFF_SHARD,
  PREPARATION_FAILED,
  NO_OUTPUT,
  OUTPUT_ILLEGAL,
}

export interface TransactionErrorObj {
  [depth: number]: TransactionError[];
}

export interface TransactionReceiptObj<TGas = string> {
  accepted?: boolean;
  cumulative_gas: TGas;
  epoch_num: string;
  event_logs?: EventLogEntry[];
  exceptions?: ExceptionEntry[];
  success: boolean;
  transitions?: TransitionEntry[];
  errors?: any;
}

export interface ExceptionEntry {
  line: number;
  message: string;
}

export interface EventLogEntry {
  address: string;
  _eventname: string;
  params: EventParam[];
}

export interface TransitionEntry {
  accepted: boolean;
  addr: string;
  depth: number;
  msg: TransitionMsg;
}

export interface TransitionMsg {
  _amount: string;
  _recipient: string;
  _tag: string;
  params: EventParam[];
}

export interface EventParam {
  vname: string;
  type: string;
  value: any;
}

export interface TransactionStatus {
  code: number;
  TxnHash: string;
  info: string;
}

export interface MinerInfo {
  dscommittee: string[];
  shards: ShardInfo[];
}

export interface ShardInfo {
  nodes: string[];
  size: number;
}
