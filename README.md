# Zilliqa-JavaScript-Library API
[![npm version](https://badge.fury.io/js/zilliqa-js.svg)](https://badge.fury.io/js/zilliqa-js)
[![Build Status](https://travis-ci.com/Zilliqa/Zilliqa-JavaScript-Library.svg?branch=master)](https://travis-ci.com/Zilliqa/Zilliqa-JavaScript-Library)
[![Gitter chat](http://img.shields.io/badge/chat-on%20gitter-077a8f.svg)](https://gitter.im/Zilliqa/)

## Installation

To use Zilliqa's Javascript API library, run ONE of the following commands from the root of your project directory.
### Yarn  
`yarn add zilliqa-js`

### NPM
`npm install zilliqa-js`

### Build Project

To build the project, run the following commands: 

```
yarn install
yarn build
```

This runs the TypeScript source files through Webpack, that in turn relies on
Babel to transpile them to a browser-friendly bundle. Type definitions are
also automatically generated.

### Run Tests

```
yarn test
```

Will run all test suites in any folder `__tests__` within the `src` directory.

## Usage

### Getting Started

To get started, you have to specify the network and set some function definitions. Once that is done, you can start to call the APIs. Here are some examples to get you started: 

```js

/* 
    Setting Up 
*/ 

let { Zilliqa } = require('zilliqa-js');

//For local testing, use URL = 'http://localhost:4201'
//To connect to the external network, use URL = 'https://api-scilla.zilliqa.com'
let URL = 'https://api-scilla.zilliqa.com'
let zilliqa = new Zilliqa({
    nodeUrl: URL
});

let node = zilliqa.getNode();


// callback receives 2 parameters, error and result
function callback (err, data) {
    if (err || data.error) {
        console.log('Error')
    } else {
        console.log(data.result)
    }
}

// generate a private key and its public address. You can change these to point to your own wallet if you have. 
let privateKey = zilliqa.util.generatePrivateKey();
let address = zilliqa.util.getAddressFromPrivateKey(privateKey);

/* 
    APIs 
*/

node.getBalance({ address: 'E8A67C0B1F19DF61A28E8E8FB5D830377045BCC7' }, callback);

```
Other than `getBalance(address)`, you can also try to create a transaction or deploy a contract. 

### Example: Create a Transaction

```js
// always use BN for `amount` to prevent overflows.
import BN from 'bn.js'

// transaction details
const txnDetails = {
    version: 0,
    nonce: 1,
    to: 'E8A67C0B1F19DF61A28E8E8FB5D830377045BCC7',
    amount: new BN(0),
    gasPrice: 1,
    gasLimit: 1
};

// sign the transaction using util methods
let txn = zilliqa.util.createTransactionJson(privateKey, txnDetails);

// send the transaction to the node
node.createTransaction(txn, callback);
```

### Example: Deploy a Contract

```js
// contains the scilla code as a string
let code = "Scilla Code";

// the immutable initialisation variables
let initParams = [
{
    "vname" : "owner",
    "type" : "Address",
    "value" : "0x1234567890123456789012345678901234567890"
},
    {
    "vname" : "total_tokens",
    "type" : "Uint128",
    "value" : "10000"
}];

// transaction details
let txnDetails = {
    version: 0,
    nonce: 1,
    to: '0000000000000000000000000000000000000000',
    amount: 0,
    gasPrice: 1,
    gasLimit: 50,
    code: code,
    data: JSON.stringify(initParams).replace(/\\"/g, '"')
};

// sign the transaction using util methods
let txn = zilliqa.util.createTransactionJson(privateKey, txnDetails);

// send the transaction to the node
node.createTransaction(txn, callback);
```


## API Methods

- **[getNetworkId](#getnetworkid)**
- **[createTransaction](#createtransaction)**
- **[getTransaction](#gettransaction)**
- **[getDsBlock](#getdsblock)**
- **[getTxBlock](#gettxblock)**
- **[getLatestDsBlock](#getlatestdsblock)**
- **[getLatestTxBlock](#getlatesttxblock)**
- **[getBalance](#getbalance)**
- **[getSmartContractState](#getsmartcontractstate)**
- **[getSmartContractCode](#getsmartcontractcode)**
- **[getSmartContractInit](#getsmartcontractinit)**
- **[getSmartContracts](#getsmartcontracts)**
- **[getBlockchainInfo](#getblockchaininfo)**
- **[isConnected](#isconnected)**

## Util Methods
- **[generatePrivateKey](#generateprivatekey)**
- **[verifyPrivateKey](#verifyprivatekey)**
- **[getAddressFromPrivateKey](#getaddressfromprivatekey)**
- **[getPubKeyFromPrivateKey](#getpubkeyfromprivatekey)**
- **[createTransactionJson](#createtransactionjson)**
- **[getAddressFromPublicKey](#getaddressfrompublickey)**
- **[isPubKey](#isPubKey)**
- **[isAddress](#isAddress)**
- **[intToByteArray](#intToByteArray)**
- **[compressPublicKey](#compressPublicKey)**

## Library Methods
- **[getLibraryVersion](#getlibraryversion)**
- **[setNode](#setnode)**
- **[currentNode](#currentnode)**



## API Reference

### `getNetworkId`

Returns the current network id

**Parameters**

none

**Returns**

`result`: `String` - The current network id name

**Usage**

```js
zilliqa.node.getNetworkId(function(err, data) {
    if (err || !data.result) {
        console.log(err)
    } else {
        console.log(data.result)
    }
})
```


### `createTransaction`

Creates a new transaction or a contract creation, if the data field contains code

**Parameters**

- `version` (32 bits): the current version
- `nonce` (64 bits): Counter equal to the number of transactions sent by the sender of this transaction. It's value is always (current account nonce + 1).
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

**Usage**

```js
let txn = zilliqa.util.createTransactionJson(privateKey, {
    version: 0,
    nonce: 1,
    to: address,
    amount: 0,
    gasPrice: 1, // default
    gasLimit: 1 // 1 - send tokens, 10 - contract invocation, 50 - contract creation
})

zilliqa.node.createTransaction(txn, function(err, data) {
    if (err || data.error) {
        console.log(err)
    } else {
        console.log(data.result)
    }
})
```


### `getTransaction`

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

**Usage**

```js
let txnId = 'c699d0ea1d4a447762bb0617f742a43b8de6792d06c56f9a2a109f0e06532f1c' // sample 64-char hex id
zilliqa.node.getTransaction({ txHash: txnId }, function(err, data) {
    if (err || data.result.error || !data.result['ID']) {
        console.log(err)
    } else {
        console.log(data.result)
    }
})
```


### `getDsBlock`

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

**Usage**

```js
zilliqa.node.getDsBlock({ blockNumber: 5 }, function(err, data) {
    if (err || !data.result) {
        console.log(err)
    } else {
        console.log(data.result)
    }
})
```


### `getTxBlock`

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

**Usage**

```js
zilliqa.node.getTxBlock({ blockNumber: 5 }, function(err, data) {
    if (err || !data.result) {
        console.log(err)
    } else {
        console.log(data.result)
    }
})
```


### `getLatestDsBlock`

Returns the most recent DS block

**Parameters**

none

**Returns**

`result`: `Object` - DS Block object

**Usage**

```js
zilliqa.node.getLatestDsBlock(function(err, data) {
    if (err || !data.result) {
        console.log(err)
    } else {
        console.log(data.result)
    }
})
```


### `getLatestTxBlock`

Returns the most recent TX block

**Parameters**

none

**Returns**

`result`: `Object` - TX Block object

**Usage**

```js
zilliqa.node.getLatestTxBlock(function(err, data) {
    if (err || !data.result) {
        console.log(err)
    } else {
        console.log(data.result)
    }
})
```


### `getBalance`

Returns the balance of a given address

**Parameters**

`address`: `String` (40 chars) - address to fetch balance and nonce of

**Returns**

`result.balance` - the current balance in ZIL
`result.nonce` - the current nonce of the account

**Usage**

```js
zilliqa.node.getBalance({ address: 'E8A67C0B1F19DF61A28E8E8FB5D830377045BCC7' }, function(err, data) {
    if (err || data.error) {
        console.log(err)
    } else {
        console.log(data.result)
    }
})
```


### `getSmartContractState`

Returns the state variables (mutable) of a given smart contract address

**Parameters**

`address`: `String` (40 chars) - smart contract address

**Returns**

`result` - json object of all the state variables

**Usage**

```js
zilliqa.node.getSmartContractState({ address: 'E8A67C0B1F19DF61A28E8E8FB5D830377045BCC7' }, function(err, data) {
    if (err || (data.result && data.result.Error)) {
        console.log(err)
    } else {
        console.log(data.result)
    }
})
```


### `getSmartContractCode`

Returns the smart contract code of a given address smart contract address

**Parameters**

`address`: `String` (40 chars) - smart contract address

**Returns**

`result.code` - string containing the code of the smart contract

**Usage**

```js
zilliqa.node.getSmartContractCode({ address: 'E8A67C0B1F19DF61A28E8E8FB5D830377045BCC7' }, function(err, data) {
    if (err || (data.result && data.result.Error)) {
        console.log(err)
    } else {
        console.log(data.result)
    }
})
```


### `getSmartContractInit`

Returns the initialization parameters (immutable) of a given smart contract address

**Parameters**

`address`: `String` (40 chars) - smart contract address

**Returns**

`result` - json object containing the initialization parameters of the smart contract

**Usage**

```js
zilliqa.node.getSmartContractInit({ address: 'E8A67C0B1F19DF61A28E8E8FB5D830377045BCC7' }, function(err, data) {
    if (err || (data.result && data.result.Error)) {
        console.log(err)
    } else {
        console.log(data.result)
    }
})
```


### `getSmartContracts`
Returns the list of smart contracts created by an account

**Parameters**

`address`: `String` (40 chars) - address that deployed the smart contracts

**Returns**

`result`: `Array` - list of smart contract addresses created by the given address

**Usage**

```js
zilliqa.node.getSmartContracts({ address: 'E8A67C0B1F19DF61A28E8E8FB5D830377045BCC7' }, function(err, data) {
    if (err || data.error) {
        console.log(err)
    } else {
        console.log(data.result)
    }
})
```


### `getBlockchainInfo`

Returns statistics about the zilliqa node currently connected to

**Parameters**

empty object

**Returns**

`Object` - json object containing various properties
- `NumPeers` : 
- `NumTxBlocks` : 
- `NumDSBlocks` : 
- `NumTransactions` : 
- `TransactionRate` : 
- `TxBlockRate` : 
- `DSBlockRate` : 
- `CurrentMiniEpoch` :
- `CurrentDSEpoch` : 
- `NumTxnsDSEpoch` : 
- `NumTxnsTxEpoch` : 

**Usage**

```js
zilliqa.node.getBlockchainInfo({}, function(err, data) {
    if (err) {
        console.log(err)
    } else {
        console.log(data.result)
    }
})
```


### `isConnected`

Checks whether a node is connected or not

**Parameters**

none

**Returns**

`Bool`

**Usage**

```js
zilliqa.node.isConnected(function(err, data) {
    if (err) {
        console.log(err)
    } else {
        // connected
    }
})
```


## Util Methods

### `generatePrivateKey`

Generate a new private key using the secp256k1 curve

**Parameters**

none

**Returns**

`Buffer` - private key object

**Usage**

```js
let pk = zilliqa.util.generatePrivateKey();
console.log(pk.toString('hex'));
```


### `verifyPrivateKey`
Verify if a private key is valid for the secp256k1 curve

**Parameters**

`String`/`Buffer` - the private key to verify

**Returns**

`Bool` - true if input string/Buffer is a valid private key else false

**Usage**

```js
let pk = zilliqa.util.generatePrivateKey();
console.log(zilliqa.util.verifyPrivateKey(pk)); // true
console.log(zilliqa.util.verifyPrivateKey("abcxyz")); // false
```


### `getAddressFromPrivateKey`

Get the public address of an account using its private key

**Parameters**

`String`/`Buffer` - the private key to get the public address of

**Returns**

`Buffer` - the public address of the input private key

**Usage**

```js
let address = zilliqa.util.getAddressFromPrivateKey(privateKey);
console.log(address.toString('hex'));
```


### `getPubKeyFromPrivateKey`

Get the public key of an account using its private key

**Parameters**

`String`/`Buffer` - the private key to get the public key of

**Returns**

`Buffer` - the public key of the input private key

**Usage**

```js
let pubkey = zilliqa.util.getPubKeyFromPrivateKey(privateKey);
console.log(pubkey.toString('hex'));
```


### `createTransactionJson`

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

**Usage**

```js
let privateKey = zilliqa.util.generatePrivateKey();

// transaction details
let txnDetails = {
    version: 0,
    nonce: 1,
    to: 'E8A67C0B1F19DF61A28E8E8FB5D830377045BCC7',
    amount: 0,
    gasPrice: 1,
    gasLimit: 1
};

// sign the transaction using util methods
let txn = zilliqa.util.createTransactionJson(privateKey, txnDetails);
```

### `getAddressFromPubKey`

Get the public address of an account using its public key

**Parameters**

`String`/`Buffer` - the public key to get the public address of

**Returns**

`Buffer` - the public address of the input private key

**Usage**

```js
let address = zilliqa.util.getAddressFromPubKey(pubKey);
console.log(address.toString('hex'));
```

### `isAddress`

Verify if an address syntax is valid

**Parameters**

`String`/`Buffer` - the address to verify

**Returns**

`Bool` - true if input string/buffer is a valid address syntax

**Usage**

```js
let pk = zilliqa.util.generatePrivateKey();
let address = zilliqa.util.getAddressFromPrivateKey(pk);
console.log(zilliqa.util.isAddress(address)); // true
console.log(zilliqa.util.isAddress('0'.repeat(30))); // false
```

### `isPubKey`

Verify if an public key syntax is valid

**Parameters**

`String`/`Buffer` - the public key to verify

**Returns**

`Bool` - true if input string/buffer is a valid public key syntax

**Usage**

```js
let pk = zilliqa.util.generatePrivateKey();
let pubKey = zilliqa.util.getPubKeyFromPrivateKey(pk);
console.log(zilliqa.util.isPubKey(pubKey)); // true
console.log(zilliqa.util.isPubKey('0'.repeat(30))); // false
```

### `intToByteArray`
Converts number to array representing the padded hex form

**Parameters**
* `number`: Integer to be converted into bytes
* `paddedSize`: Integer specifying the padded size

**Returns**
* `byteArray`: Byte array of integer

**Usage**
```
let nonceStr = zilliqa.util.intToByteArray(nonce, 64).join("");
```

### `compressPublicKey`
Compresses a public key into fewer bytes

**Parameters**
`String` - the public key to be compressed

**Returns**
`String` - Compressed version of the public key
## Library Methods

### `getLibraryVersion`

Returns the library version number

**Parameters**

none

**Returns**

`String` - the library version


### `setNode`

Sets the node to connect to

**Parameters**

`String` - http url of the node

**Returns**

null


### `getNode`

Returns the node currently connected to

**Parameters**

none

**Returns**

`Object` - the currently connected node object

## Licence 
You can view our [licence here](https://github.com/Zilliqa/zilliqa/blob/master/LICENSE).
