//  Copyright (C) 2018 Zilliqa
//
//  This file is part of Zilliqa-Javascript-Library.
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

const { BN, Long, bytes, units } = require('@zilliqa-js/util');
const { Zilliqa } = require('@zilliqa-js/zilliqa');
const {
  toBech32Address,
  getAddressFromPrivateKey,
} = require('@zilliqa-js/crypto');

const zilliqa = new Zilliqa('https://dev-api.zilliqa.com');

const chainId = 333; // chainId of the developer testnet
const msgVersion = 1; // current msgVersion
const VERSION = bytes.pack(chainId, msgVersion);

// Populate the wallet with an account
const privateKey =
  'deb5c896228f8515146aa16f94a558ba14e52d8496b4b267b2d59cd9036f39a6';

zilliqa.wallet.addByPrivateKey(privateKey);

const address = getAddressFromPrivateKey(privateKey);
console.log(`My account address is: ${address}`);
console.log(`My account bech32 address is: ${toBech32Address(address)}`);

async function testBatchTransactionWithoutConfirm() {
  try {
    let txList = [];

    for (let i = 0; i < 2; i++) {
      // create a new transaction object
      const tx = zilliqa.transactions.new(
        {
          version: VERSION,
          toAddr: '0xA54E49719267E8312510D7b78598ceF16ff127CE',
          amount: new BN(units.toQa('1', units.Units.Zil)),
          gasPrice: units.toQa('2000', units.Units.Li),
          gasLimit: Long.fromNumber(50),
        },
        false,
      );

      txList.push(tx);
    }

    console.log('Signing and sending transactions...\n');

    // for batch transactions without confirm
    // batch transactions must be signed first
    // this would set the correct nonce for each transactions
    const signedTxList = await zilliqa.wallet.signBatch(txList);

    // output signature for comparison
    for (const signedTx of signedTxList) {
      console.log(
        'The expected transaction signature (before sending) is: %o',
        signedTx.txParams.signature,
      );
    }

    const batchResult = await zilliqa.blockchain.createBatchTransactionWithoutConfirm(
      signedTxList,
    );

    for (const tx of batchResult) {
      // nonce must be different
      // signatures must be identical when comparing to after they are processed on the blockchain
      console.log('The transaction id is: %o', tx.id);
      console.log('The transaction nonce is: %o', tx.nonce);
      console.log('The actual transaction signature is: %o', tx.signature);
      console.log(
        'Is the current transaction confirmed?: %o\n',
        tx.isConfirmed(),
      );
    }
  } catch (err) {
    console.error(err);
  }
}

testBatchTransactionWithoutConfirm();
