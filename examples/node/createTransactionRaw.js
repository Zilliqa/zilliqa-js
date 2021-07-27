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

const { Transaction } = require('@zilliqa-js/account');
const { bytes } = require('@zilliqa-js/util');
const { Zilliqa } = require('@zilliqa-js/zilliqa');
const {
  toBech32Address,
  getAddressFromPrivateKey,
} = require('@zilliqa-js/crypto');

const zilliqa = new Zilliqa('https://dev-api.zilliqa.com');

async function testBlockchain() {
  try {
    const payload =
      '{"version":21823489,"nonce":1012,"toAddr":"4BAF5faDA8e5Db92C3d3242618c5B47133AE003C","amount":"10000000","pubKey":"0246e7178dc8253201101e18fd6f6eb9972451d121fc57aa2a06dd5c111e58dc6a","gasPrice":"1000000000","gasLimit":"50","code":"","data":"","signature":"d91b538341a47e1b58698f2eb78b88f307bbccd4c0d92a8e46f3b559e6f6b99054c1b8eb078f31c75f1202f48a9ef751ff7eafd4b0534b435802645fbe481f5c","priority":false}';
    const tx = JSON.parse(payload);
    const id = await zilliqa.blockchain.createTransactionRaw(payload);

    // process confirm
    console.log(`The transaction id is:`, id);
    console.log(`Waiting transaction be confirmed`);

    // to perform confirmation, we need a `empty` transaction object
    const emptyTx = new Transaction(
      { toAddr: '0x' + tx.toAddr },
      zilliqa.provider,
    );
    const confirmedTxn = await emptyTx.confirm(id);
    console.log(`The transaction status is:`);
    console.log(confirmedTxn.receipt);
  } catch (err) {
    console.log(err);
  }
}

testBlockchain();
