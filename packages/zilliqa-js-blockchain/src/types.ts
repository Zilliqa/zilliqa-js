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
  NumTxnsTxEpoch: number;
  ShardingStructure: ShardingStructure;
}

export interface ShardingStructure {
  NumPeers: number[];
}

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
  BlockNum: string;
  Difficulty: number;
  DifficultyDS: number;
  GasPrice: number;
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

const enum TxBlockType {
  MICRO,
  FINAL,
}

export interface TxBlockHeader {
  Type: TxBlockType;
  Version: number;
  GasLimit: string;
  GasUsed: string;
  Rewards: string;
  PrevBlockHash: string;
  BlockNum: string;
  Timestamp: string;

  TxnHash: string;
  StateHash: string;
  NumTxns: number;
  NumMicroBlocks: number;

  MinerPubKey: string;
  DSBlockNum: string;
}

export interface TxBlockObj {
  body: {
    HeaderSign: string;
    MicroBlockEmpty: number[];
    MicroBlockHashes: string[];
  };
  header: TxBlockHeader;
}

export interface TxList {
  number: number;
  TxnHashes: string[];
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
