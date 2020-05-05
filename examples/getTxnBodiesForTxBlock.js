const { Zilliqa } = require('@zilliqa-js/zilliqa');

const zilliqa = new Zilliqa('https://dev-api.zilliqa.com');

async function test() {
  try {
    const txns = await zilliqa.blockchain.getTxnBodiesForTxBlock('1339810');
    if (txns.result === undefined) {
      console.log(txns.error);
    } else {
      console.log(txns.result);
    }
  } catch (e) {
    console.log(e);
  }
}

test();
