const { BN, Long, bytes, units } = require('@zilliqa-js/util');
const { Zilliqa } = require('@zilliqa-js/zilliqa');
const { getAddressFromPrivateKey } = require('@zilliqa-js/crypto');

const zilliqa = new Zilliqa('https://dev-api.zilliqa.com');
const chainId = 333; // chainId of the developer testnet
const msgVersion = 1; // current msgVersion
const VERSION = bytes.pack(chainId, msgVersion);
const myGasPrice = units.toQa('2000', units.Units.Li);

// Populate the wallet with an account
const privateKey =
  '3375F915F3F9AE35E6B301B7670F53AD1A5BE15D8221EC7FD5E503F21D3450C8';

zilliqa.wallet.addByPrivateKey(privateKey);

/**
 *
 * wallet.sign(tx)
 *
 * example of "online" signing, nonce is NOT REQUIRED in the Transaction obj
 * nonce is automatically computed inteernally with GetBalance
 *
 */
async function onlineSign() {
  try {
    console.log('Online signing with balance check...\n');

    const address = getAddressFromPrivateKey(privateKey);
    const balance = await zilliqa.blockchain.getBalance(address);
    console.log('current nonce is: %o', balance.result.nonce);

    const tx = zilliqa.transactions.new(
      {
        version: VERSION,
        toAddr: '0xA54E49719267E8312510D7b78598ceF16ff127CE',
        amount: new BN(units.toQa('1', units.Units.Zil)),
        gasPrice: myGasPrice,
        gasLimit: Long.fromNumber(50),
      },
      false,
    );
    const result = await zilliqa.wallet.sign(tx);
    console.log(result);
    console.log('txn nonce: %o', result.nonce);
    console.log('txn signature: %o', result.signature);
  } catch (err) {
    console.log(err);
  }
}

/**
 *
 * wallet.sign(tx, true)
 * explicit 'true' flag implies offline mode which skips balance checks
 *
 * example of "offline" signing, nonce is REQUIRED in the Transaction obj
 * nonce MUST BE SUPPLIED
 *
 */
async function offlineSign() {
  try {
    console.log('Offline signing...\n');

    // const address = getAddressFromPrivateKey(privateKey);
    // const balance = await zilliqa.blockchain.getBalance(address);
    // console.log('current nonce is: %o', balance.result.nonce);

    // nonce must be EXPLICITLY DEFINED when flag is 'true'
    const tx = zilliqa.transactions.new(
      {
        version: VERSION,
        nonce: 9999,
        toAddr: '0xA54E49719267E8312510D7b78598ceF16ff127CE',
        amount: new BN(units.toQa('1', units.Units.Zil)),
        gasPrice: myGasPrice,
        gasLimit: Long.fromNumber(50),
      },
      false,
    );
    const result = await zilliqa.wallet.sign(tx, true);
    console.log(result);
    console.log('txn nonce: %o', result.nonce);
    console.log('txn signature: %o', result.signature);
  } catch (err) {
    console.log(err);
  }
}

// comment on/off as desired
// onlineSign();
offlineSign();
