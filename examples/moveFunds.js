const { BN, Long, bytes, units } = require('./../packages/zilliqa-js-util/');
const { Zilliqa } = require('./../packages/zilliqa/');
const {
  toBech32Address,
  getAddressFromPrivateKey,
} = require('./../packages/zilliqa-js-crypto');

async function moveFundsFn(amount, toAddr, privateKey) {
  try {
    // Constants
    const chainId = 1; // chainId of the developer testnet
    const msgVersion = 1; // current msgVersion
    const VERSION = bytes.pack(chainId, msgVersion);
    const myGasPrice = units.toQa('2000', units.Units.Li); // Gas Price that will be used by all transactions

    const zilliqa = new Zilliqa('http://localhost:5555');

    console.log('moving funds to address...');

    const address = getAddressFromPrivateKey(privateKey);
    const balance = await zilliqa.blockchain.getBalance(address);
    console.log('current nonce is: %o', balance.result.nonce);

    const tx = zilliqa.transactions.new(
      {
        version: VERSION,
        toAddr: toAddr,
        amount: new BN(units.toQa(amount, units.Units.Zil)),
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
