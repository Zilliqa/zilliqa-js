# Zilliqa-JavaScript-Library API
[![Build Status](https://travis-ci.com/Zilliqa/Zilliqa-JavaScript-Library.svg?branch=feature/monorepo)](https://travis-ci.com/Zilliqa/Zilliqa-JavaScript-Library)
[![codecov](https://codecov.io/gh/Zilliqa/Zilliqa-JavaScript-Library/branch/feature/monorepo/graph/badge.svg)](https://codecov.io/gh/Zilliqa/Zilliqa)
[![Gitter chat](http://img.shields.io/badge/chat-on%20gitter-077a8f.svg)](https://gitter.im/Zilliqa/)
[![lerna](https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg)](https://lerna.js.org/)

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

```javascript
const { Transaction } = require('@zilliqa-js/account');
const { BN, Long, bytes, units,NetworkType } = require('@zilliqa-js/util');
const { Zilliqa } = require('@zilliqa-js/zilliqa');
const CP = require ('@zilliqa-js/crypto');

const zilliqa = new Zilliqa(NetworkType.TestNet);

// Populate the wallet with an account
const privkey = '3375F915F3F9AE35E6B301B7670F53AD1A5BE15D8221EC7FD5E503F21D3450C8';

zilliqa.wallet.addByPrivateKey(
  privkey
);

const address = CP.getAddressFromPrivateKey(privkey);
console.log("Your account address is:");
console.log(`0x${address}`);

async function testBlockchain() {
  try {

    // Get Balance
    const balance = await zilliqa.blockchain.getBalance(address);
    // Get Minimum Gas Price from blockchain
    const minGasPrice = await zilliqa.blockchain.getMinimumGasPrice();
    console.log(`Your account balance is:`);
    console.log(balance.result)
    console.log(`Current Minimum Gas Price: ${minGasPrice.result}`);
    const myGasPrice = units.toQa('1000', units.Units.Li); // Gas Price that will be used by all transactions
    console.log(`My Gas Price ${myGasPrice.toString()}`)
    console.log('Sufficient Gas Price?');
    console.log(myGasPrice.gte(new BN(minGasPrice.result))); // Checks if your gas price is less than the minimum gas price

    // Send a transaction to the network
    const tx = await zilliqa.blockchain.createTransaction(
      zilliqa.transactions.new({
        version: VERSION,
        toAddr: "573EC96638C8BB1C386394602E1460634F02ADDA",
        amount: new BN(units.toQa("1", units.Units.Zil)), // Sending an amount in Zil (1) and converting the amount to Qa
        gasPrice: myGasPrice, // Minimum gasPrice veries. Check the `GetMinimumGasPrice` on the blockchain
        gasLimit: Long.fromNumber(1)
      })
    );
    

    console.log(`The transaction status is:`);
    console.log(tx.receipt);

    // Deploy a contract
    const code = `scilla_version 0

    (* HelloWorld contract *)

    import ListUtils

    (***************************************************)
    (*               Associated library                *)
    (***************************************************)
    library HelloWorld

    let not_owner_code = Int32 1
    let set_hello_code = Int32 2

    (***************************************************)
    (*             The contract definition             *)
    (***************************************************)

    contract HelloWorld
    (owner: ByStr20)

    field welcome_msg : String = ""

    transition setHello (msg : String)
      is_owner = builtin eq owner _sender;
      match is_owner with
      | False =>
        e = {_eventname : "setHello()"; code : not_owner_code};
        event e
      | True =>
        welcome_msg := msg;
        e = {_eventname : "setHello()"; code : set_hello_code};
        event e
      end
    end


    transition getHello ()
        r <- welcome_msg;
        e = {_eventname: "getHello()"; msg: r};
        event e
    end`;

    const init = [
      // this parameter is mandatory for all init arrays
      {
        vname: "_scilla_version",
        type: "Uint32",
        value: "0"
      },
      {
        vname: "owner",
        type: "ByStr20",
        // NOTE: all byte strings passed to Scilla contracts _must_ be
        // prefixed with 0x. Failure to do so will result in the network
        // rejecting the transaction while consuming gas!
        value: `0x${address}`
      }
    ];

    // Instance of class Contract
    const contract = zilliqa.contracts.new(code, init);

    // Deploy the contract
    const [deployTx, hello] = await contract.deploy({
      version: VERSION,
      gasPrice: myGasPrice,
      gasLimit: Long.fromNumber(10000)
    });

    // Introspect the state of the underlying transaction
    console.log(`Deployment Transaction ID: ${deployTx.id}`);
    console.log(`Deployment Transaction Receipt:`);
    console.log(deployTx.txParams.receipt);

    // Get the deployed contract address
    console.log("The contract address is:");
    console.log(hello.address);
    const callTx = await hello.call(
      "setHello",
      [
        {
          vname: "msg",
          type: "String",
          value: "Hello World"
        }
      ],
      {
        // amount, gasPrice and gasLimit must be explicitly provided
        version: VERSION,
        amount: new BN(0),
        gasPrice: myGasPrice,
        gasLimit: Long.fromNumber(8000),
      }
    );
    console.log(callTx);

    //Get the contract state
    const state = await hello.getState();
    console.log("The state of the contract is:");
    console.log(state);
  } catch (err) {
    console.log(err);
  }
}

testBlockchain();


```

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
