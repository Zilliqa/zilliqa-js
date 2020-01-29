const { Transaction } = require('@zilliqa-js/account');
const { bytes } = require('@zilliqa-js/util');
const { Zilliqa } = require('@zilliqa-js/zilliqa');
const {
  toBech32Address,
  getAddressFromPrivateKey,
} = require('@zilliqa-js/crypto');

const zilliqa = new Zilliqa('https://dev-api.zilliqa.com');

// These are set by the core protocol, and may vary per-chain.
// You can manually pack the bytes according to chain id and msg version.
// For more information: https://apidocs.zilliqa.com/?shell#getnetworkid

const chainId = 333; // chainId of the developer testnet
const msgVersion = 1; // current msgVersion
const VERSION = bytes.pack(chainId, msgVersion);

// Populate the wallet with an account
const privateKey =
  '3375F915F3F9AE35E6B301B7670F53AD1A5BE15D8221EC7FD5E503F21D3450C8';

zilliqa.wallet.addByPrivateKey(privateKey);

const address = getAddressFromPrivateKey(privateKey);
console.log(`My account address is: ${address}`);
console.log(`My account bech32 address is: ${toBech32Address(address)}`);

async function testBlockchain() {
  try {
    const payload =
      '{"version":21823489,"nonce":1012,"toAddr":"4BAF5faDA8e5Db92C3d3242618c5B47133AE003C","amount":"10000000","pubKey":"0246e7178dc8253201101e18fd6f6eb9972451d121fc57aa2a06dd5c111e58dc6a","gasPrice":"1000000000","gasLimit":"1","code":"","data":"","signature":"d91b538341a47e1b58698f2eb78b88f307bbccd4c0d92a8e46f3b559e6f6b99054c1b8eb078f31c75f1202f48a9ef751ff7eafd4b0534b435802645fbe481f5c","priority":false}';
    const tx = JSON.parse(payload);
    const id = await zilliqa.blockchain.createTransactionRaw(payload);

    // check the pending status
    const pendingStatus = await zilliqa.blockchain.getPendingTxn(id);
    console.log(`Pending status is: `);
    console.log(pendingStatus.result);

    // process confirm
    console.log(`The transaction id is:`, id);
    console.log(`Waiting transaction be confirmed`);
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
