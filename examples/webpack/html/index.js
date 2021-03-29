async function test() {
  const zilliqa = new Zilliqa.Zilliqa('https://dev-api.zilliqa.com');
  const chainId = 333;
  const msgVersion = 1;
  const VERSION = Zilliqa.bytes.pack(chainId, msgVersion);
  console.log(VERSION);
  // Populate the wallet with an account
  const privateKey =
    '3375F915F3F9AE35E6B301B7670F53AD1A5BE15D8221EC7FD5E503F21D3450C8';

  zilliqa.wallet.addByPrivateKey(privateKey);

  const address = Zilliqa.getAddressFromPrivateKey(privateKey);
  console.log(`My account address is: ${address}`);
  console.log(
    `My account bech32 address is: ${Zilliqa.toBech32Address(address)}`,
  );

  // Get Balance
  const balance = await zilliqa.blockchain.getBalance(address);
  // Get Minimum Gas Price from blockchain
  const minGasPrice = await zilliqa.blockchain.getMinimumGasPrice();

  // Account balance (See note 1)
  console.log(`Your account balance is:`);
  console.log(balance.result);
  console.log(`Current Minimum Gas Price: ${minGasPrice.result}`);

  const myGasPrice = Zilliqa.units.toQa('2000', Zilliqa.units.Units.Li); // Gas Price that will be used by all transactions
  console.log(`My Gas Price ${myGasPrice.toString()}`);
  const isGasSufficient = myGasPrice.gte(new Zilliqa.BN(minGasPrice.result)); // Checks if your gas price is less than the minimum gas price
  console.log(`Is the gas price sufficient? ${isGasSufficient}`);

  // Send a transaction to the network
  console.log('Sending a payment transaction to the network...');
  const tx = await zilliqa.blockchain.createTransactionWithoutConfirm(
    // Notice here we have a default function parameter named toDs which means the priority of the transaction.
    // If the value of toDs is false, then the transaction will be sent to a normal shard, otherwise, the transaction.
    // will be sent to ds shard. More info on design of sharding for smart contract can be found in.
    // https://blog.zilliqa.com/provisioning-sharding-for-smart-contracts-a-design-for-zilliqa-cd8d012ee735.
    // For payment transaction, it should always be false.
    zilliqa.transactions.new(
      {
        version: VERSION,
        toAddr: '0xA54E49719267E8312510D7b78598ceF16ff127CE',
        amount: new Zilliqa.BN(
          Zilliqa.units.toQa('1', Zilliqa.units.Units.Zil),
        ), // Sending an amount in Zil (1) and converting the amount to Qa
        gasPrice: myGasPrice, // Minimum gasPrice veries. Check the `GetMinimumGasPrice` on the blockchain
        gasLimit: Zilliqa.Long.fromNumber(50),
      },
      false,
    ),
  );

  // process confirm
  console.log(`The transaction id is:`, tx.id);
  const confirmedTxn = await tx.confirm(tx.id);

  console.log(`The transaction status is:`);
  console.log(confirmedTxn.receipt);
}

test();
