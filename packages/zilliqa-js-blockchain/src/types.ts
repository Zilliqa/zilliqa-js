export interface TransactionObj {
  ID: string;
  version: string;
  nonce: number;
  toAddr: string;
  amount: string;
  gasPrice: string;
  gasLimit: string;
  signature: string;
  receipt: TransactionReceiptObj;
}

export interface DsBlockHeader {
  blockNum: string;
  difficulty: number;
  leaderPubKey: string;
  minerPubKey: string;
  nonce: string;
  prevhash: string;
  // unix epoch
  timestamp: string;
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

const enum TxBlockType {
  MICRO,
  FINAL,
}

export interface TxBlockHeader {
  type: TxBlockType;
  version: number;
  GasLimit: string;
  GasUsed: string;
  MinerPubKey: string;
  NumMicroBlocks: number;
  NumTxns: number;
  StateHash: string;
  Timestamp: string;
  TxnHash: string;
}

export interface TxBlockObj {
  body: {
    HeaderSign: string;
    MicroBlockEmpty: number[];
    MicroBlockHashes: string[];
  };
  header: TxBlockHeader;
}

export interface TransactionReceiptObj {
  success: boolean;
  cumulative_gas: string;
  event_logs: EventLogEntry[];
}

export interface EventLogEntry {
  address: string;
  _eventname: string;
  params: EventParam[];
}

export interface EventParam {
  vname: string;
  type: string;
  value: string;
}
