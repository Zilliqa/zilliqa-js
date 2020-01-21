const { Zilliqa } = require('@zilliqa-js/zilliqa');

const zilliqa = new Zilliqa('https://dev-api.zilliqa.com');

async function test() {
  try {
    const tx = await zilliqa.blockchain.getTransaction(
      '3f3459c8c7751ebb71c72ed70cc4e9cbde2f2936ce0e694cd60bae85bf0f687b',
    );
    console.log(tx.getReceipt());
  } catch (e) {
    console.log(e);
  }
}

test();
