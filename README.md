# Zilliqa Threshold Signatures JavaScript Library
[![Build Status](https://travis-ci.com/Zilliqa/Zilliqa-JavaScript-Library.svg?branch=feature/monorepo)](https://travis-ci.com/Zilliqa/Zilliqa-JavaScript-Library)
[![codecov](https://codecov.io/gh/Zilliqa/Zilliqa-JavaScript-Library/branch/feature/monorepo/graph/badge.svg)](https://codecov.io/gh/Zilliqa/Zilliqa)
[![Gitter chat](http://img.shields.io/badge/chat-on%20gitter-077a8f.svg)](https://gitter.im/Zilliqa/)
[![lerna](https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg)](https://lerna.js.org/)

This project is a fork of [Zilliqa JavaScript Library](https://github.com/Zilliqa/Zilliqa-JavaScript-Library).<br>
It moves away the concept of a _single_ private key system, and instead **injects a two-party Schnorr signatures scheme**: we introduce a _server_ which acts as the co-signer, and the wallet functions as the _client_.<br>
The two parties hold independent _shares_ which are both required in order to produce a signature and broadcast a valid transaction. **At no moment the complete private key is constructed.** <br>
The [Quick Start](#quick-start) example is updated to use the two-party scheme.<br>
Also, the [Demo](#demo) section demonstrates core functionality.

## Introduction

`zilliqa-js` is structured as a Lerna monorepo. Each package roughly
corresponds to a discrete `ZilliqaModule`, most of which can be used
independently.

The only required package is `@zilliqa-js/core`, which contains
the default `HTTPProvider`, and other core abstractions that are necessary for
other modules to function.

The following table provides a description of each module and what you may
want to use it for.

| package                  | description                                                                                                                                                               | dependencies                                                                            |
| ---                      | ---                                                                                                                                                                       | ---                                                                                     |
| [`@zilliqa-js/core`](./packages/zilliqa-js-core)      | Core abstractions and base classes, such as `HTTPProvider` and network logic for interfacing with the Zilliqa JSON-RPC.                                                   | none                                                                                    |
| [`@zilliqa-js/account`](./packages/zilliqa-js-account)     | `Wallet`, `Account` and `Transaction` abstractions live in this package.                                                                                                  | `@zilliqa-js/core`, `@zilliqa-js/crypto`, `@zilliqa-js/util`, `@zilliqa-js/proto`       |
| [`@zilliqa-js/blockchain`](./packages/zilliqa-js-blockchain) | Main interface to the Zilliqa `JSON-RPC`.                                                                                                                                 | none                                                                                    |
| [`@zilliqa-js/contract`](./packages/zilliqa-js-contract)   | Exposes a `Contracts` module that takes care of smart contract deployment and interaction.                                                                                | `@zilliqa-js/account`, `@zilliqa-js/blockchain`, `@zilliqa-js/core`, `@zilliqa-js/util` |
| [`@zilliqa-js/crypto`](./packages/zilliqa-js-crypto)     | Exposes several loosely-coupled cryptographic convenience functions for working with the Zilliqa blockchain and its cryptographic primitives, such as Schnorr signatures. | `@zilliqa-js/util`                                                                      |
| [`@zilliqa-js/proto`](./packages/zilliqa-js-proto)      | Protobuf source files and corresponding generated JS modules.                                                                                                             | none                                                                                    |
| [`@zilliqa-js/util`](./packages/zilliqa-js-util)       | Miscellaneous functions that take care of serialisation/deserialisation and validation.                                                                                   | none                                                                                    |

## Installation

It is recommended that developers install the JavaScript client by making use
of the umbrella package `@zilliqa-js/zilliqa`. This takes care of bootstrapping the various modules, which are then accessible as members of the
`Zilliqa` class.

```shell
yarn add @zilliqa-js/zilliqa
# bn.js should be added with the above package. if it is not, install it manually.
yarn add bn.js
```

As this library is still in a relatively early stage of development, we
recommend using the `next` tag to install it in NPM. This will ensure that you
receive the latest published version, as it may not be ideal to wait for
a `semver` bump before being able to take advantage of new features/bug fixes.

## Quick Start

Launch server (acts as the co-signer in the two-party signing scheme):
```javascript
const { Server } = require('@zilliqa-js/account');
new Server().launch();
```
Create a wallet:
```javascript
const { Zilliqa } = require('@zilliqa-js/zilliqa');
const zilliqa = new Zilliqa('https://dev-api.zilliqa.com');
const fs = require('fs');
const ENCRYPTED_SHARE_PATH = './enc-share.json';

async function createWallet() {
  await zilliqa.wallet.create();  // run two-party Schnorr key generation and store the share in default account
  const address = zilliqa.wallet.defaultAccount.address;
  fs.writeFileSync(ENCRYPTED_SHARE_PATH, await zilliqa.wallet.export(address, 'passphrase'));  // save encrypted share
  console.log(address);
  // 0x42dEa4002600642f2c564bBcfddb568Bcc9728B5
}

createWallet();
```

After sending some Zil to this address (e.g., by a [faucet](https://dev-wallet.zilliqa.com/faucet)), sign and send a transaction:

```javascript
const { BN, Long, bytes, units } = require('@zilliqa-js/util');
const CHAIN_ID = 333;
const MSG_VERSION = 1;
const VERSION = bytes.pack(CHAIN_ID, MSG_VERSION);

async function testBlockchain() {
  await zilliqa.wallet.addByKeystore(fs.readFileSync(ENCRYPTED_SHARE_PATH), 'passphrase');  // load encrypted share

  const balanceResponse = await zilliqa.blockchain.getBalance(normalizedAddress);
  console.log(balanceResponse.result.balance);
  // 100508300000000

  const minGasPriceResponse = await zilliqa.blockchain.getMinimumGasPrice();
  const minGasPrice = new BN(minGasPriceResponse.result);
  const tx = await zilliqa.blockchain.createTransaction(
    zilliqa.transactions.new({
      version: VERSION,
      toAddr: 'zil1jp3mdjppv49aa8uuy0s354lqnxw85sk57jupp0',  // should be either a valid checksum or bech32 address
      amount: new BN(units.toQa(0.001, units.Units.Zil)),
      gasPrice: minGasPrice,
      gasLimit: Long.fromNumber(1)
    })
  );
  console.log(tx.id);
  // 0f9a2a0a10d94d71003fceba37bf47a9958f785a23f6cd85e6bdc62a0053458
}

testBlockchain();
```

## Demo

You can also run the two-party signing protocol using a demo from the command line.<br>
Server:
```bash
$ demo/server
```
Client:
```bash
$ demo/client --help

Usage: client [options] [command]

Options:
  -h, --help                     output usage information

Commands:
  address
  balance <address>
  transfer <from> <to> <amount>
```

|![demo](https://raw.githubusercontent.com/KZen-networks/Zilliqa-JavaScript-Library/dev/demo/zilliqa-tss-demo.gif "Zilliqa Threshold Wallet Demo")|
|:--:|

## API Documentation and examples

Each package contains its own examples and API documentation. For convenience,
these are links to the respective `README` documents.

- [`account`](./packages/zilliqa-js-account/README.md)
- [`blockchain`](./packages/zilliqa-js-blockchain/README.md)
- [`contract`](./packages/zilliqa-js-contract/README.md)
- [`core`](./packages/zilliqa-js-core/README.md)
- [`crypto`](./packages/zilliqa-js-crypto/README.md)
- [`proto`](./packages/zilliqa-js-proto/README.md)
- [`util`](./packages/zilliqa-js-util/README.md)

## Development

This repository makes use of several technologies to provide a better and
faster development experience for contributors, and has to be bootstrapped
before one can do productive work.

### Bootstrapping

`zilliqa-js` leverages Project References, which is available in TypeScript
from version `3.x`. As such, the build process is slightly different.

```shell
# install all dependencies and shared devDependencies
yarn install

# symlink packages, compile TS source files, and generate protobuf files.
yarn bootstrap

# watch TS source files and recompile on change
yarn build:ts -w
```
### Tests

Because of the two-party signing protocol, in order for the wallet to be able to generate accounts and sign transactions,
the server needs to be up. **So before running tests make sure you launch the server:**

```bash
$ yarn run start-server
```

Tests for each package reside in `packages/src/*/tests`, and are run using
`jest`. Files containing unit tests always have the prefix `*.spec.ts`, while integration/e2e tests have the
prefix `*.ispect.ts`.

In order to run any tests, you must first make sure the source files are
compiled and all dependencies are installed by running `yarn bootstrap`.

If you wish to run integration tests, you may do so agains a local or remote
Zilliqa testnet. However, note that the public testnet may not always be
caught up to the state-of-the-art, and, therefore, can cause `zilliqa-js` to
behave in unexpected ways.

```shell
# run all unit tests
yarn test

# configure environment variables
# $GENESIS_PRIV_KEY - the private key used to run transaction-related tests
# $GENESIS_ADDRESS - the address for the private key
# HTTP_PROVIDER - the URL of the Zilliqa JSON-RPC server
# MNEMONIC - the seed words of the wallet account used to run transaction-related tests
# CHAIN_ID - the chain ID of the specified network
vim .env

# run all integration tests
yarn test:integration
```

### Bundling

`zilliqa-js` is bundled using `rollup`. Unfortunately, because `elliptic` is
a major dependency and contains a circular dependency that causes `rollup` to
choke, we also make use of `webpack` to pre-process and thereby eliminate the
problem.

To build the distributable bundles, simple run `yarn bundle`. This will output
two bundles, `*.umd.js` and `*.esm.js`, to `packages/*/dist`. Node.js clients
are pointed to the `umd` bundle, and bundlers are pointed to `esm`.

*NOTE: these bundles are _not_ minified.*

## Licence 

You can view our [licence here](https://github.com/Zilliqa/zilliqa/blob/master/LICENSE).
