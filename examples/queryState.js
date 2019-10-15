/**
 * Demo Query State : Short example to illustrate how to get contract state from
 * a deployed token.
 */

const { Zilliqa } = require('@zilliqa-js/zilliqa');

const zilliqa = new Zilliqa('https://dev-api.zilliqa.com');

// Standard fungible token deployed on devnet
const tokenContract = '5938fc8af82250ad6cf1da3bb92f4aa005cb2717';

async function test() {
  /**
   * initialising contract class. Contract class is a convenient way for you to use
   * repeatedly call contracts and make queries from.
   *
   * There's two types of "data" in scilla. Mutable fields (available through getState)
   * and immutable fields (cannot be changed once deployed, available through getInit)
   */
  const contract = zilliqa.contracts.at(tokenContract);
  const allState = await contract.getState();
  console.log(`Getting the entire contract state`);
  console.log(allState);

  const initState = await contract.getInit();
  console.log(`Getting the contract init (immutable variables)`);
  console.log(initState);

  console.log(`\n\nGetting a particular field in the contract`);
  const state2 = await contract.getSubState('_balance');
  console.log(state2);

  console.log(`\n\nGetting a particular entry in a map`);
  const state3 = await contract.getSubState('balances', [
    '0x381f4008505e940ad7681ec3468a719060caf796',
  ]);
  console.log(state3);

  /**
   * Don't want to initialise a class as you are just making an adhoc query? Try this.
   */

  console.log(
    `\n\nYou can also get state / substate directly without using the Contract class.`,
  );
  const state4 = await zilliqa.blockchain.getSmartContractSubState(
    '0x5938fc8af82250ad6cf1da3bb92f4aa005cb2717',
    'balances',
    ['0x381f4008505e940ad7681ec3468a719060caf796'],
  );
  console.log(state4.result);
}

test();
