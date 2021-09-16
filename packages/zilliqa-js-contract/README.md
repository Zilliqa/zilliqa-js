# @zilliqa-js/contract

> Classes for managing Scilla smart contracts on the Zilliqa blockchain.

# Interfaces

```typescript
interface DeployParams {
  gasPrice: BN;
  gasLimit: Long;
  nonce?: number;
  pubKey?: string;
}

interface CallParams {
  amount: BN;
  gasPrice: BN;
  gasLimit: Long;
  nonce?: number;
  pubKey?: string;
}

interface Field {
  name: string;
  type: string;
}

interface Transition {
  name: string;
  params: Field[];
}

interface ABI {
  name: string;
  fields: Field[];
  params: Field[];
  transitions: Transition[];
}

interface Value {
  vname: string;
  type: string;
  value: string;
}

type Init = Value[];
type State = any;
```

# Classes

## `Contracts`

A factory class for creating `Contract` instances. Useful for managing
`Provider` instances set on `Contract`s. The factory is mainly used by the
top-level module exported by `@zilliqa-js/zilliqa`.

### `Contracts(provider: Provider, signer?: Wallet): Contracts`

**Parameters**

- `provider`: `Provider` - a `Provider` instance
- `signer`: `Wallet` - a `Wallet` instance, used for signing transactions.

**Returns**

- `Contracts` - a `Contracts` instance.

## Members

### `provider: Provider`

### `signer: Wallet`

## Static Methods

### `static getAddressForContract(tx: Transaction): string`

Computes the address for a contract deployment by concatenating
`senderAddress` and `nonce` and hasing the resulting bytes. Note that this
method will not compute an accurate address if the provided `nonce` is not up
to date with the actual nonce on the blockchain.

**Parameters**

- `tx`: `Transaction` - a `Transaction` with `nonce` and `senderAddress`.

**Returns**

- The compute contract address.

## Instance Methods

### `at(address: string, abi: ABI, code: string, init?: Init, state?: State): Contract`

Constructs a `Contract` with the provided parameters. It is recommended that
this method by used only to construct contracts that have already been
deployed.

**Parameters**

- `address`: `string` - the contract address.
- `abi`: `ABI` (optional) - the ABI return by `scilla-checker` with `-contractinfo` flag.
- `code`: `string` (optional) - UTF-8 encoded Scilla smart contract code.
- `init`: `Init` (optional) - the initialisation parameters of the smart contract.
- `state`: `State` (optional) - the current smart contract state.

**Returns**

- `Contract` - a `Contract` instance.

### `new(code: string, init: Init, abi?: ABI): Contract`

Constructs a `Contract` with the provided parameters, that is not deployed.
The contract may subsequently be deployed.

**Parameters**

- `code`: `string` - UTF-8 encoded Scilla smart contract code.
- `init`: `Init` - the initialisation parameters of the smart contract.
- `abi`: `ABI` (optional) - the ABI return by `scilla-checker`.

**Returns**

- `Contract` - a `Contract` instance.

### `Contract(factory: Contracts, code?: string, address?: string, abi?: ABI, init?: Init, state?: State): Contracts`

A class representing a single smart contract. Allows for deployment and
calling the smart contract's transitions.

**Parameters**

- `factory`: Contracts - the creating factory instance.
- `code`: `string` (Optional) - UTF-8 Scilla smart contract code.
- `address`: `string` (Optional)
- `init`: `any` (Optional) - contract initialisation parameters.
- `state`: `any` (Optional) - contract state.
- `abi`: `string` (Optional) - scilla interface

**Returns**

- `Contract` - a `Contract` instance.

## Members

`factory: Contracts`
`provider: Provider`
`signer: Wallet`

`init: Init`
`abi?: ABI` (Optional)
`state?: State` (Optional)
`address?: string` (Optional)
`code?: string` (Optional)
`status: ContractStatus`

## Instance Methods

### `isInitialised(): boolean`

Returns `true` if no attempt has been made to deploy the `Contract`, or its
status is unknown.

**Returns**

- `boolean`

### `isDeployed(): boolean`

Returns `true` if the contract has been successfully deployed.

**Returns**

- `boolean`

### `isRejected(): boolean`

Returns `true` if the contract deployment attempt was rejected by the network.

**Returns**

- `boolean`

### `deploy(params: DeployParams, attempts: number = 33, interval: number = 1000): Promise<Contract>`

Deploys a contract to the blockchain. This method will automatically generate
and sign the underlying `Transaction` and broadcast it. The status of the
`Contract` may then be ascertained by using `isRejected` or `isDeployed`, once
the `Promise` resolves.

**Parameters**

- `params`: `DeployParams` - a subset of TxParams. Passed to the underlying
  `Transaction`. This can be used to manually provide `nonce` and `pubKey`,
  if it is desirable to sign the underlying transaction with a non-default
  account in the `Wallet`.
- `attempts` (Optional - default 33): `number` - the number of times to poll the lookup node for
  transaction receipt.
- `interval` (Optional - default 1000): `number` - the amount of time to wait
  between attempts. increases linearly (`numAttempts * interval`).

**Returns**

- `Promise<Contract>` - will be rejected if a network error occurs. A resolved
  `Promise` does not indicate that the `Contract` is deployed, as the
  underlying `Transaction` may be confirmed by the blockchain but
  unsuccessful, due to lack of `gas`, and so on.

### `call(transition: string, args: Value[], params: CallParams): Promise<Transaction>`

Calls a transition of the current contract. At the moment, this is a low-level
interface for interacting with simple smart contracts.

**Parameters**

- `transition`: `string` - the exact name of the contract transition to be
  invoked. _case matters_
- `args`: `Value[]` - JSON-encoded array of transition arguments.
- `params`: `CallParams` - a subset of `TxParams`. Passed to the underlying
  `Transaction`.
- `attempts` (Optional - default 20): `number` - the number of times to poll the lookup node for
  transaction receipt.
- `interval` (Optional - default 1000): `number` - the amount of time to wait
  between attempts. increases linearly (`numAttempts * interval`).

**Returns**

- `Promise<Transaction>` - the Transaction that has been signed and broadcast
  to the network.

### `getState(): Promise<State>`

Queries the blockchain for the smart contract's state. Note that this method
will return the _entire_ state of the smart contract. As a result, if you have
a large amount of data stored in a smart contract do not use this method on
a client. Instead, use a server-side layer to cache and proxy such queries.

**Parameters**

None

**Returns**

- `Promise<State>` - the Contract state.

### `getInit(): Promise<State>`

Queries the blockchain for the smart contract's init (a.k.a. immutable variables of a contract)

**Parameters**

None

**Returns**

- `Promise<State>` - the Contract Init.

### `getSubState(variableName: string, indices: string[]): Promise<State>`

Queries the contract state, filtered by the variable names. This function is the filtered version of `getState`. As `getSubState` performs the filtering, `variableName` of a field is required.

If the `subState` is not found, this returns a `null` response.

**Parameters**

- `variableName`: `string` - the variable name within a state
- `indices` : `string[]` - optional variable. If the `variableName` is a `Map`, an array of indices may be provided.

**Returns**

- `Promise<State>` - the Contract Init.
