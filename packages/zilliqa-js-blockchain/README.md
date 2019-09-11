# @zilliqa-js/blockchain
> Classes for high-level interaction with the Zilliqa blockchain.

# Interfaces

```typescript
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
  code: string;
  data: string;
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
```

# Classes

## `Blockchain`

Class that wraps http requests for blockchain-related RPC calls.

### `Blockchain(provider: Provider, signer: Wallet): Blockchain`

**Parameters**

- `provider`: `Provider`
- `signer`: `Wallet`

**Returns**

- `Blockchain`

## Members

### `provider: Provider`

### `signer: Wallet`

## Instance Methods

### `CreateTransaction(transaction : Transaction, maxAttempts? : number, interval? : interval) : Promise<Transaction>`

Creates a transaction and polls the lookup node for a transaction receipt. The transaction is considered to be lost if it is not confirmed within the timeout period.

**Parameters**
- `transaction`: `Transaction` - the transaction object
- `attempts` (Optional - default 20): `number` - the number of times to poll the lookup node for transaction receipt.
- `interval` (Optional - default 1000): `number` - the amount of time to wait between attempts. increases linearly (`numAttempts * interval`)

**Returns** 

- `Promise<Transaction>` - the Transaction that has been signed and broadcasted to the network.

### `getBlockChainInfo(): Promise<RPCResponse<ShardingStructure, string>>`

Retrieves generally blockchain information, such as the number of nodes per
shard.

**Parameters**

None

**Returns**

- `Promise<RPCResponse<ShardingStructure, string>>`

### `getDSBlock(blockNum: number): Promise<RPCResponse<DsBlockObj, string>>`

Queries the blockchain for a specific DS block, by number.

**Parameters**

- `blockNum`: `string` - the DS block the retrieve

**Returns**

- `Promise<RPCResponse<DsBlockObj, string>>`

### `getLatestDSBlock(): Promise<RPCResponse<DsBlockObj, string>>`

Gets the most recently confirmed DS block.

**Parameters**

None

**Returns**

- `Promise<RPCResponse<DsBlockObj, string>>`

### `getNumDSBlocks(): Promise<RPCResponse<string, string>>`

Queries the blockchain for the number of confirmed DS blocks in the chain.

**Parameters**

None

**Returns**

- `Promise<RPCResponse<string, string>>` - use `parseInt` as the number is encoded as a string.

### `getDSBlockRate(): Promise<RPCResponse<number, string>>`

Gets the ds blocks processed per second.

**Parameters**

None

**Returns**

- `Promise<RPCResponse<number, string>>`

### `getDSBlockListing(max: number): Promise<RPCResponse<BlockList, string>>`

Gets a paginated list of DS blocks.

**Parameters**

`max`: `number` - the maximum number of pages to retrieve

**Returns**

- `Promise<RPCResponse<BlockList, string>>`

### `getTxBlock(blockNum: number): Promise<RPCResponse<TxBlockObj, string>>`

Retrieves a TxBlock by number.

**Parameters**

`blockNum`: `number` - the tx block to retrieve.

**Returns**

- `Promise<RPCResponse<TxBlockObj, string>>`

### `getLatestTxBlock(): Promise<RPCResponse<TxBlockObj, string>>`

Gets the most recently confirmed Tx block.

**Parameters**

None

**Returns**

- `Promise<RPCResponse<DsBlockObj, string>>`

### `getNumTxBlocks(): Promise<RPCResponse<string, string>>`

Queries the blockchain for the number of confirmed Tx blocks in the chain.

**Parameters**

None

**Returns**

- `Promise<RPCResponse<string, string>>` - use `parseInt` as the number is encoded as a string.

### `getTxBlockRate(): Promise<RPCResponse<number, string>>`

Gets the Tx blocks processed per second.

**Parameters**

None

**Returns**

- `Promise<RPCResponse<number, string>>`

### `getTxBlockListing(max: number): Promise<RPCResponse<BlockList, string>>`

Gets a paginated list of Tx blocks.

**Parameters**

`max`: `number` - the maximum number of pages to retrieve

**Returns**

- `Promise<RPCResponse<BlockList, string>>`
