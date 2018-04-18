# Zilliqa-JavaScript-Library API

## API List

- getNetworkId
- createTransaction
- getTransaction
- getDsBlock
- getTxBlock
- getLatestDsBlock
- getLatestTxBlock
- getBalance

## Library Methods

- getLibraryVersion
- isConnected
- setNode
- currentNode



## API Reference

### getNetworkId

Returns the current network id.

**Parameters**

none

**Returns**

String - The current network id.

"1": Mainnet
"2": Testnet


### createTransaction

Creates new message call transaction or a contract creation, if the data field contains code.

**Parameters**

- version (32 bits): the current version
- nonce (64 bits): Counter equal to the number of transactions sent by the sender of this transaction.
- to (160 bits): Destination account address. Incase of new contract account, equal to rightmost 160 bits of SHA3-256 of empty string
- pubkey (264 bits): An EC-Schnorr public key that should be used to verify the signature. Determines the sending address of the transaction
- amount (128 bits): Transaction amount to be transferred to the destination address.
- gasPrice (128 bits): amount that the sender is willing to pay per unit of gas for computations incurred in transaction processing
- gasLimit (128 bits): the maximum amount of gas that should be used while processing this transaction
- code (unlimited): expandable byte array that specifies the contract code. It is present only when the transaction creates a new contract account
- data (unlimited): expandable byte array that specifies the data that should be used to process the transaction, present only when the transaction invokes a call to a contract at the destination address.
- signature (512 bits): An EC-Schnorr signature of the entire object

Each transaction is uniquely identified by a
`transaction ID` — a SHA3-256 digest of the transaction data that excludes the `signature`field.


### getTransaction

Returns the information about a transaction requested by transaction hash

**Parameters**

DATA, 32 Bytes - hash of a transaction
params: [
   "0xb903239f8543d04b5dc1ba6579132b143087c68db1b2168786408fcbce568238"
]
**Returns**

Object -
- version (32 bits): the current version
- nonce (64 bits): Counter equal to the number of transactions sent by the sender of this transaction
- to (160 bits): Destination account address
- from (160 bits): Sender account address
- amount (128 bits): Transaction amount transferred from sender to destination
- pubKey (264 bits): An EC-Schnorr public key that should be used to verify the signature. The pubkey field also determines the sending address of the transaction
- signature (512 bits): An EC-Schnorr signature of the entire object


### getDsBlock

Returns information about a Directory Service block by block number.

**Parameters**

DATA, 32 Bytes - Block number
params: '3'

**Returns**

Object - A block object with header and signature fields

header:
- version (32 bits): Current version.
- previous hash (256 bits): The SHA3-256 digest of its parent's block header
- pubkey (264 bits): The public key of the miner who did PoW on this block header
- difficulty (64 bits): This can be calculated from the 
previous block’s difficulty and the block number. It stores
the difficulty of the PoW puzzle.
- number (256 bits): The number of ancestor blocks. The genesis block has a block number of 0
- timestamp (64 bits): Unix’s time() at the time of creation of this block
- mixHash (256 bits): A digest calculated from nonce which allows detecting DoS attacks
- nonce (64 bits): A solution to the PoW

signature:
- signature (512 bits): The signature is an EC-Schnorr based multisignature on the DS-Block header signed by DS nodes
- bitmap (1024 bits): It records which DS nodes participated in the multisignature. We denote the bitmap by a bit vector B, where, B[i] = 1 if the i-th node signed the header else B[i] = 0.


### getTxBlock

Returns information about a Transaction block by block number.

**Parameters**

DATA, 32 Bytes - Block number
params: '3'

**Returns**

header:
- type (8 bits): A TX-Block is of two types, micro block (0x00) and final block (0x01)
- version (32 bits): Current version
- previous hash (256 bits): The SHA3-256 digest of its parent block header
- gas limit (128 bits): Current limit for gas expenditure per block
- gas used (128 bits): Total gas used by transactions in this block
- number (256 bits): The number of ancestor blocks. The genesis block has a block number of 0
- timestamp (64 bits): Unix’s time() at the time of creation of this block
- state root (256 bits): It is a SHA3-256 digest that represents the global state after all transactions are executed and finalized. If the global state is stored as a trie, then state root is the digest of the root of the trie
- transaction root (256 bits): It is a SHA3-256 digest that represents the root of the Merkle tree that stores all transactions that are present in this block
- tx hashes (each 256 bits): A list of SHA3-256 digests of the transactions. The signature part of the transaction is also hashed
- pubkey (264 bits): It is the EC-Schnorr public key of the leader who proposed the block
- pubkey micro blocks (unlimited): It is a list of EC-Schnorr public keys (each 264 bits in length). The list contains the public keys of the leaders who proposed transactions. The field is present only if it is a final block
- parent block hash (256 bits): It is the SHA3-256 digest of the previous final block header
- parent ds hash (256 bits): It is the SHA3-256 digest of its parent DS-Block header
- parent ds block number (256 bits): It is the parent DS-Block number

data:
- tx count (32 bits): The number of transactions in this block
- tx list (unlimited): A list of transactions

signature:
- signature (512 bits): The signature is an EC-Schnorr based multisignature on the TX-Block header signed by a set of nodes. The signature is produced by a different set of nodes depending on whether it is a micro block or a final block
- bitmap (1024 bits): It records which nodes participated in the multisignature. We denote the bitmap by a bit vector B, where, B[i] = 1 if the i-th node signed the header else B[i] = 0


### getBalance

Returns the balance of the given address account

**Parameters**

DATA, 20 Bytes - address to check for balance.

**Returns**

QUANTITY - integer of the current balance in ZIL.


### getLatestDsBlock

Returns the most recent DS block.

**Parameters**

none

**Returns**

DS Block object


### getLatestTxBlock

Returns the most recent TX block.

**Parameters**

none

**Returns**

TX Block object



## Library Reference

### getLibraryVersion

Returns the library version number

**Parameters**

none

**Returns**

String - library version


### isConnected

Checks whether a node is connected or not

**Parameters**

none

**Returns**

Boolean


### setNode

Sets the node to connect to

**Parameters**

String - http url of the node

**Returns**

null


### getNode

Returns the node currently connected to

**Parameters**

none

**Returns**

The node object

## Licence 
You can view our [licence here](https://github.com/Zilliqa/zilliqa/blob/master/LICENSE).
