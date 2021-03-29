import './App.css';
import {useEffect, useState} from 'react';
import { Ellipsis } from 'react-css-spinners'

function App() {
  const [address, setAddress] = useState('');
  const [balance, setBalance] = useState("0");
  const [txnId, setTxnId] = useState('');
  const [isPending, setIsPending] = useState(false);

  // get the Zilliqa object from the window scope
  const zilWindow = window.Zilliqa;
  const zilliqa = new zilWindow.Zilliqa('https://dev-api.zilliqa.com');
  const chainId = 333;
  const msgVersion = 1;
  const VERSION = zilWindow.bytes.pack(chainId, msgVersion);

  // Populate the wallet with an account
  const privateKey ='3375F915F3F9AE35E6B301B7670F53AD1A5BE15D8221EC7FD5E503F21D3450C8';

  // use zilliqa object to send a payment transaction
  const sendPayment = async () => {
    setIsPending(true);

    // Get Minimum Gas Price from blockchain
    zilliqa.wallet.addByPrivateKey(privateKey);
    const minGasPrice = await zilliqa.blockchain.getMinimumGasPrice();
    const myGasPrice = zilWindow.units.toQa('2000', zilWindow.units.Units.Li); // Gas Price that will be used by all transactions
    const isGasSufficient = myGasPrice.gte(new zilWindow.BN(minGasPrice.result)); // Checks if your gas price is less than the minimum gas price
    
    console.log(`My Gas Price ${myGasPrice.toString()}`);
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
          amount: new zilWindow.BN(
                    zilWindow.units.toQa('1', zilWindow.units.Units.Zil),
                  ), // Sending an amount in Zil (1) and converting the amount to Qa
          gasPrice: myGasPrice, // Minimum gasPrice varies. Check the `GetMinimumGasPrice` on the blockchain
          gasLimit: zilWindow.Long.fromNumber(50),
        },
        false,
      ),
    );

    // process confirm
    console.log(`The transaction id is:`, tx.id);
    const confirmedTxn = await tx.confirm(tx.id);
    setTxnId(tx.id);
    
    console.log(`The transaction status is:`);
    console.log(confirmedTxn.receipt);
    setIsPending(false);
  }

  useEffect(() => {
    async function initialSetup() {
      zilliqa.wallet.addByPrivateKey(privateKey);
      const address = zilWindow.getAddressFromPrivateKey(privateKey);
      const balance = await zilliqa.blockchain.getBalance(address);
      
      console.log("address: %o", address);
      console.log("balance: %o", balance.result.balance)
      setAddress(address);
      setBalance(zilWindow.units.fromQa(new zilWindow.BN(balance.result.balance), zilWindow.units.Units.Zil)); // convert from Qa to ZIL
    }
    initialSetup();
    // eslint-disable-next-line
  }, []);

  // link the transaction id to viewblock
  const getViewBlockLink = () => {
    return "https://viewblock.io/zilliqa/tx/0x" + txnId + "?network=testnet";
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>Zilliqa Webpack (React) Demo</h1>
        <p><small>Address: {address}</small></p>
        <p><small>Balance: {balance} ZIL</small></p>
        {
          txnId ?
          <>
          <h4 className="success">Success!</h4>
          <p><small>Transaction ID: <a href={getViewBlockLink()} target = "_blank" rel = "noopener noreferrer">{txnId}</a></small></p> 
          </>
          : null
        }
        
        {/* show the send payment button if not yet clicked, otherwise show a spinner */}
        {
          isPending ?
          <Ellipsis color="#1ADBB2" size={40} /> :
          <button onClick={() => sendPayment()}>Send Payment</button>
        }
      </header>
    </div>
  );
}

export default App;
