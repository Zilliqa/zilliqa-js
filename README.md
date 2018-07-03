# Zilliqa-JavaScript-Library API

## Build

Execute `npm install`, followed by `npm install -g gulp` and `gulp build` to generate build/z-lib.min.js.


## Setup

Include `"z-lib": "github:Zilliqa/Zilliqa-JavaScript-Library"` in your `package.json` dependencies to install the zilliqa javascript library.

```js
import { zLib } from 'z-lib';

let zlib = new zLib({
  nodeUrl: 'http://localhost:4201'
});

let node = zlib.getNode();

// use API methods
node.getBalance({ address: 'E8A67C0B1F19DF61A28E8E8FB5D830377045BCC7' }, callback);

// use util methods
let txn = zlib.util.createTransactionJson(privateKey, {
	version: 0,
	nonce: 1,
	to: '0000000000000000000000000000000000000000',
	amount: 0,
	gasPrice: 1,
	gasLimit: 50,
	code: codeString,
	data: JSON.stringify(initParams).replace(/\\"/g, '"')
});

node.createTransaction(txn, callback);

// callback receives 2 parameters, error and result
function callback (err, data) {
	if (err || data.error) {
		console.log('Error')
	} else {
		console.log(data.result)
	}
}
```

## API Methods

- getNetworkId
- createTransaction
- getTransaction
- getDsBlock
- getTxBlock
- getLatestDsBlock
- getLatestTxBlock
- getBalance
- getSmartContractState
- getSmartContractCode
- getSmartContractInit
- getSmartContracts
- getBlockchainInfo
- getDSBlockListing
- getTxBlockListing
- getNumTxnsTxEpoch
- getNumTxnsDSEpoch
- getTransactionListing

## Util Methods
- generatePrivateKey
- verifyPrivateKey
- getAddressFromPrivateKey
- getPubKeyFromPrivateKey
- createTransactionJson

## Library Methods

- getLibraryVersion
- isConnected
- setNode
- currentNode



## API Reference

### getNetworkId

Returns the current network id

**Parameters**

none

**Returns**

`result`: `String` - The current network id name


### createTransaction

Creates a new transaction or a contract creation, if the data field contains code

**Parameters**

- `version` (32 bits): the current version
- `nonce` (64 bits): Counter equal to the number of transactions sent by the sender of this transaction.
- `to` (160 bits): Destination account address. Incase of new contract account, set as `0000000000000000000000000000000000000000`
- `pubkey` (264 bits): An EC-Schnorr public key that should be used to verify the signature. Determines the sending address of the transaction
- `amount` (128 bits): Transaction amount to be transferred to the destination address.
- `gasPrice` (128 bits): amount that the sender is willing to pay per unit of gas for computations incurred in transaction processing
- `gasLimit` (128 bits): the maximum amount of gas that should be used while processing this transaction
- `code` (unlimited): expandable byte array that specifies the contract code. It is present only when the transaction creates a new contract account
- `data` (unlimited): expandable byte array that specifies the data that should be used to process the transaction, present only when the transaction invokes a call to a contract at the destination address.
- `signature` (512 bits): An EC-Schnorr signature of the entire object

Each transaction is uniquely identified by a
`transaction ID` — a SHA3-256 digest of the transaction data that excludes the `signature`field.

**Returns**

`result`: `String` - transaction id of the newly created transaction

### getTransaction

Returns the information about a transaction requested by transaction hash

**Parameters**

`txHash`: `String` - the transaction ID to retrieve details of

**Returns**

`result`: `Object`  - A transaction object
- `version` (32 bits): the current version
- `nonce` (64 bits): Counter equal to the number of transactions sent by the sender of this transaction
- `to` (160 bits): Destination account address
- `from` (160 bits): Sender account address
- `amount` (128 bits): Transaction amount transferred from sender to destination
- `pubKey` (264 bits): An EC-Schnorr public key that should be used to verify the signature. The pubkey field also determines the sending address of the transaction
- `signature` (512 bits): An EC-Schnorr signature of the entire object


### getDsBlock

Returns information about a Directory Service block by block number.

**Parameters**

`blockNumber`: `String` - Block number to fetch details of

**Returns**

`result`: `Object` - A block object with header and signature fields

header:
- `version` (32 bits): Current version.
- `previous hash` (256 bits): The SHA3-256 digest of its parent's block header
- `pubkey` (264 bits): The public key of the miner who did PoW on this block header
- `difficulty` (64 bits): This can be calculated from the 
previous block’s difficulty and the block number. It stores
the difficulty of the PoW puzzle.
- `number` (256 bits): The number of ancestor blocks. The genesis block has a block number of 0
- `timestamp` (64 bits): Unix’s time() at the time of creation of this block
- `mixHash` (256 bits): A digest calculated from nonce which allows detecting DoS attacks
- `nonce` (64 bits): A solution to the PoW

signature:
- `signature` (512 bits): The signature is an EC-Schnorr based multisignature on the DS-Block header signed by DS nodes
- `bitmap` (1024 bits): It records which DS nodes participated in the multisignature. We denote the bitmap by a bit vector B, where, B[i] = 1 if the i-th node signed the header else B[i] = 0.


### getTxBlock

Returns information about a Transaction block by block number.

**Parameters**

`blockNumber`: `String` - Block number to fetch details of

**Returns**

`result`: `Object` - A block object with header and signature fields

header:
- `type` (8 bits): A TX-Block is of two types, micro block (0x00) and final block (0x01)
- `version` (32 bits): Current version
- `previous hash` (256 bits): The SHA3-256 digest of its parent block header
- `gas limit` (128 bits): Current limit for gas expenditure per block
- `gas used` (128 bits): Total gas used by transactions in this block
- `number` (256 bits): The number of ancestor blocks. The genesis block has a block number of 0
- `timestamp` (64 bits): Unix’s time() at the time of creation of this block
- `state root` (256 bits): It is a SHA3-256 digest that represents the global state after all transactions are executed and finalized. If the global state is stored as a trie, then state root is the digest of the root of the trie
- `transaction root` (256 bits): It is a SHA3-256 digest that represents the root of the Merkle tree that stores all transactions that are present in this block
- `tx hashes` (each 256 bits): A list of SHA3-256 digests of the transactions. The signature part of the transaction is also hashed
- `pubkey` (264 bits): It is the EC-Schnorr public key of the leader who proposed the block
- `pubkey micro blocks` (unlimited): It is a list of EC-Schnorr public keys (each 264 bits in length). The list contains the public keys of the leaders who proposed transactions. The field is present only if it is a final block
- `parent block hash` (256 bits): It is the SHA3-256 digest of the previous final block header
- `parent ds hash` (256 bits): It is the SHA3-256 digest of its parent DS-Block header
- `parent ds block number` (256 bits): It is the parent DS-Block number

data:
- `tx count` (32 bits): The number of transactions in this block
- `tx list` (unlimited): A list of transactions

signature:
- `signature` (512 bits): The signature is an EC-Schnorr based multisignature on the TX-Block header signed by a set of nodes. The signature is produced by a different set of nodes depending on whether it is a micro block or a final block
- `bitmap` (1024 bits): It records which nodes participated in the multisignature. We denote the bitmap by a bit vector B, where, B[i] = 1 if the i-th node signed the header else B[i] = 0


### getLatestDsBlock

Returns the most recent DS block

**Parameters**

none

**Returns**

`result`: `Object` - DS Block object


### getLatestTxBlock

Returns the most recent TX block

**Parameters**

none

**Returns**

`result`: `Object` - TX Block object


### getBalance

Returns the balance of a given address

**Parameters**

`address`: `String` (40 chars) - address to fetch balance and nonce of

**Returns**

`result.balance` - the current balance in ZIL
`result.nonce` - the current nonce of the account

### getSmartContractState

Returns the state variables (mutable) of a given smart contract address

**Parameters**

`address`: `String` (40 chars) - smart contract address

**Returns**

`result` - json object of all the state variables


### getSmartContractCode

Returns the smart contract code of a given address smart contract address

**Parameters**

`address`: `String` (40 chars) - smart contract address

**Returns**

`result.code` - string containing the code of the smart contract


### getSmartContractInit

Returns the initialization parameters (immutable) of a given smart contract address

**Parameters**

`address`: `String` (40 chars) - smart contract address

**Returns**

`result` - json object containing the initialization parameters of the smart contract


### getSmartContracts
Returns the list of smart contracts created by an account

**Parameters**

`address`: `String` (40 chars) - address that deployed the smart contracts

**Returns**

`result`: `Array` - list of smart contract addresses created by the given address


### getNumTxnsTxEpoch

Returns the number of transactions in the most recent Tx epoch.

**Parameters**

none

**Returns**

`result`: `String` - number of transactions in the latest Tx block

### getNumTxnsDSEpoch

Returns the number of transactions in the most recent DS epoch.

**Parameters**

none

**Returns**

`result`: `String` - number of transactions in the latest DS block

## Util Methods

### generatePrivateKey

Generate a new private key using the secp256k1 curve

**Parameters**

none

**Returns**

`Buffer` - private key object

### verifyPrivateKey

Verify if a private key is valid for the secp256k1 curve

**Parameters**

`String`/`Buffer` - the private key to verify

**Returns**

`Bool` - true if input string/Buffer is a valid private key else false


### getAddressFromPrivateKey

Get the public address of an account using its private key

**Parameters**

`String`/`Buffer` - the private key to get the public address of

**Returns**

`String` - the public address of the input private key


### getPubKeyFromPrivateKey

Get the public key of an account using its private key

**Parameters**

`String`/`Buffer` - the private key to get the public key of

**Returns**

`String` - the public key of the input private key


### createTransactionJson

Construct the transaction object for use in `createTransaction` API

**Parameters**

`String`/`Buffer` - the private key of the account creating the transaction, used to sign the transaction
`Object` - object containing the following transaction details:
- `version` - current version (set as 0)
- `nonce` - counter equal to the number of transactions created by the transaction sender
- `to` - destination account address. Incase of new contract account, set as `0000000000000000000000000000000000000000`
- `amount` - transaction amount to be transferred to the destination address.
- `gasPrice` - amount that the sender is willing to pay per unit of gas for computations incurred in transaction processing (default 1)
- `gasLimit` - the amount of gas that should be used while processing this transaction (1 for regular transaction, 10 for contract invocation, 50 for contract creation)
- `code` (optional) - string specifying the contract code. Present only when creating a new contract account
- `data` (optional) - stringified JSON object specifying initialization parameters

**Returns**

`result`: `String` - number of transactions in the latest DS block


## Library Methods

### getLibraryVersion

Returns the library version number

**Parameters**

none

**Returns**

`String` - the library version


### isConnected

Checks whether a node is connected or not

**Parameters**

none

**Returns**

`Bool`


### setNode

Sets the node to connect to

**Parameters**

`String` - http url of the node

**Returns**

null

### getNode

Returns the node currently connected to

**Parameters**

none

**Returns**

`Object` - the currently connected node object

## Licence 
You can view our [licence here](https://github.com/Zilliqa/zilliqa/blob/master/LICENSE).
