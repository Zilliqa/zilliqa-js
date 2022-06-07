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

const { BN, Long, bytes, units } = require('./../packages/zilliqa-js-util/');
const { Zilliqa } = require('./../packages/zilliqa/');
const {
  toBech32Address,
  getAddressFromPrivateKey,
} = require('./../packages/zilliqa-js-crypto');
//const {moveFundsFn} = require('./moveFunds.js');


///////////////////////////////////////////////////////////////
async function moveFundsFn(amount, toAddr, privateKey) {
  try {
    // Constants
    const chainId = 1; // chainId of the developer testnet
    const msgVersion = 1; // current msgVersion
    const VERSION = bytes.pack(chainId, msgVersion);
    const myGasPrice = units.toQa('2000', units.Units.Li); // Gas Price that will be used by all transactions

    const zilliqa = new Zilliqa('http://localhost:5555');

    console.log('moving funds to address...');

    zilliqa.wallet.addByPrivateKey(privateKey);
    const address = getAddressFromPrivateKey(privateKey);
    const balance = await zilliqa.blockchain.getBalance(address);
    console.log('current nonce is: %o', balance.result.nonce);

    //const tx = zilliqa.transactions.new(
    //  {
    //    version: VERSION,
    //    toAddr: toAddr,
    //    amount: new BN(units.toQa(amount, units.Units.Zil)),
    //    gasPrice: myGasPrice,
    //    gasLimit: Long.fromNumber(50),
    //  },
    //  false,
    //);

    const tx_to_send =       zilliqa.transactions.new(
      {
        version: VERSION,
        toAddr: toAddr,
        amount: new BN(units.toQa(amount, units.Units.Zil)),
        gasPrice: myGasPrice,
        gasLimit: Long.fromNumber(50),
      },
      false,
      );

    console.log(tx_to_send);

    const tx = await zilliqa.blockchain.createTransactionWithoutConfirm(tx_to_send);

    console.log(`The transaction id is:`, tx.id);
    const confirmedTxn = await tx.confirm(tx.id);

    console.log(`The transaction status is:`);
    console.log(confirmedTxn.receipt);

    ////const result = await zilliqa.wallet.sign(tx);
    //console.log(result);
    //console.log('finished payment. Txn nonce: %o', result.nonce);
    //console.log('finished payment. Txn signature: %o', result.signature);
  } catch (err) {
    console.log(err);
  }
}
///////////////////////////////////////////////////////////////

const zilliqa = new Zilliqa('http://localhost:5555');

// Genesis private key
const privateKeyVanilla =
  'db11cfa086b92497c8ed5a4cc6edb3a5bfe3a640c43ffb9fc6aa0873c56f2ee3';

const  privateKeyEth = 'b87f4ba7dcd6e60f2cca8352c89904e3993c5b2b0b608d255002edcda6374de4';

// New way - add ecdsa wallet
zilliqa.wallet.addByPrivateKeyECDSA(privateKeyEth);

const ethAddr = zilliqa.wallet.defaultAccount.address;
const address = getAddressFromPrivateKey(privateKeyVanilla);

console.log(`My vanilla account address is: ${address}`);
console.log(`My eth-style account address is: ${ethAddr}`);

console.log("moving funds from vanilla account to eth account");
//moveFundsFn('101010', ethAddr, privateKeyVanilla);//.finally(

zilliqa.blockchain.getBalance(address).then((bal) => {console.log(bal); console.log(`Old balance: ${bal.result.balance}`);}).then(
zilliqa.blockchain.getBalance(ethAddr).then((bal) => {console.log(`Eth balance: ${bal.result.balance}`)}));

//const balance = await zilliqa.blockchain.getBalance(address);
//console.log(`Old balance: ${balance.result.balance}`);

