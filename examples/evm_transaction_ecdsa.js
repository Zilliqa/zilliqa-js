var Web3 = require('web3');
var Accounts = require('web3-eth-accounts');

var web3 = new Web3();

var accounts = new Accounts();

console.log("version :", web3.version);

let account_test = web3.eth.accounts.create();
const addr = account_test.address;

console.log("account :", account_test);

//accounts.sign()

//web3.eth.signTypedData("whoee", addr);
//accounts._signTypedData();
web3.eth.signTypedDat

let data      = accounts.signTransaction({
    to: addr,
    value: 1000,
    gas: 21000,
    gasPrice: 1000,
    nonce: 9090,
    chainId: 1 // mainNet
}, account_test.privateKey)
  .catch(error => {console.log("we have the error!", error);})
  .then(data => {console.log("getting data and have: ", data);});

console.log("signed raw transaction: ");

//// A JS library for recovering signatures:
//const sigUtil = require('eth-sig-util')
//
//const msgParams = [
//  {
//    type: 'string',      // Any valid solidity type
//    name: 'Message',     // Any string label you want
//    value: 'Hi, Alice!'  // The value to sign
//  },
//  {
//    type: 'uint32',
//    name: 'A number',
//    value: '1337'
//  }
//]
//
//// Get the current account:
//web3.eth.getAccounts(function (err, accounts) {
//  if (!accounts) {
//    console.log("missing accounts...");
//    return;
//  }
//  signMsg(msgParams, accounts[0])
//})
//
//console.log("signing1");
//signMsg(msgParams, account_test);
//console.log("signing2");
//
//function signMsg(msgParams, from) {
//
//  web3.currentProvider.sendAsync({
//    method: 'eth_signTypedData',
//    params: [msgParams, from],
//    from: from,
//  }, function (err, result) {
//
//    if (err) return console.error(err)
//    if (result.error) {
//      return console.error(result.error.message)
//    }    const recovered = sigUtil.recoverTypedSignature({
//      data: msgParams,
//      sig: result.result
//    })
//    if (recovered === from ) {
//      alert('Recovered signer: ' + from)
//    } else {
//      alert('Failed to verify signer, got: ' + result)
//    }
//  })
//}
