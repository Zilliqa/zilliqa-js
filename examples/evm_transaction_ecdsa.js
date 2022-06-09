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

//const {Wallet} = require('ethereumjs-wallet');
var Wallet = require('ethereumjs-wallet');
var EthUtil = require('ethereumjs-util');

// Constants
const chainId = 1; // chainId of the developer testnet
const msgVersion = 1; // current msgVersion
const VERSION = bytes.pack(chainId, msgVersion);

async function executeEVMTransaction(privateKeyEth) {
  try {
    console.log("Executing EVM transaction");

    // Load in eth private key
    const zilliqa = new Zilliqa('http://localhost:5555');
    zilliqa.wallet.addByPrivateKeyECDSA(privateKeyEth);

    const myGasPrice = units.toQa('2000', units.Units.Li); // Gas Price that will be used by all transactions

    // Send a transaction to the network
    console.log('Sending an amount to the address we want the contract to be at');

    const inject_signature = zilliqa.wallet.defaultAccount.sign("0").signature.slice(2);
    const publicKey = zilliqa.wallet.defaultAccount.publicKey;
    //const xx = web3.eth.accounts.privateKeyToAccount(privateKey);

    const tx = await zilliqa.blockchain.createTransactionWithoutConfirmNoSign(
      // Notice here we have a default function parameter named toDs which means the priority of the transaction.
      // If the value of toDs is false, then the transaction will be sent to a normal shard, otherwise, the transaction.
      // will be sent to ds shard. More info on design of sharding for smart contract can be found in.
      // https://blog.zilliqa.com/provisioning-sharding-for-smart-contracts-a-design-for-zilliqa-cd8d012ee735.
      // For payment transaction, it should always be false.
      zilliqa.transactions.new(
        {
          version: VERSION,
          toAddr: '0xA54E49719267E8312510D7b78598ceF16ff127CE',
          pubKey: publicKey,
          nonce: 666,
          signature: inject_signature,
          amount: new BN(units.toQa('1', units.Units.Zil)), // Sending an amount in Zil (1) and converting the amount to Qa
          gasPrice: myGasPrice, // Minimum gasPrice veries. Check the `GetMinimumGasPrice` on the blockchain
          gasLimit: Long.fromNumber(50),
        },
        false,
      ),
    );

    //// process confirm
    //console.log(`The transaction id is:`, tx.id);
    //const confirmedTxn = await tx.confirm(tx.id);

    //console.log(`The transaction status is:`);
    //console.log(confirmedTxn.receipt);

    // Deploy a contract
    console.log(`Deploying a new contract....`);

    const code = `608060405234801561001057600080fd5b50336000806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555061065d806100606000396000f3fe608060405234801561001057600080fd5b50600436106100415760003560e01c8063435ffe94146100465780638da5cb5b146100625780638da9b77214610080575b600080fd5b610060600480360381019061005b91906102fb565b61009e565b005b61006a61012d565b60405161007791906103af565b60405180910390f35b610088610156565b60405161009591906103ca565b60405180910390f35b3373ffffffffffffffffffffffffffffffffffffffff166100bd61012d565b73ffffffffffffffffffffffffffffffffffffffff1614610113576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161010a906103ec565b60405180910390fd5b80600190805190602001906101299291906101e8565b5050565b60008060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff16905090565b606060018054610165906104f2565b80601f0160208091040260200160405190810160405280929190818152602001828054610191906104f2565b80156101de5780601f106101b3576101008083540402835291602001916101de565b820191906000526020600020905b8154815290600101906020018083116101c157829003601f168201915b5050505050905090565b8280546101f4906104f2565b90600052602060002090601f016020900481019282610216576000855561025d565b82601f1061022f57805160ff191683800117855561025d565b8280016001018555821561025d579182015b8281111561025c578251825591602001919060010190610241565b5b50905061026a919061026e565b5090565b5b8082111561028757600081600090555060010161026f565b5090565b600061029e61029984610431565b61040c565b9050828152602081018484840111156102ba576102b96105b8565b5b6102c58482856104b0565b509392505050565b600082601f8301126102e2576102e16105b3565b5b81356102f284826020860161028b565b91505092915050565b600060208284031215610311576103106105c2565b5b600082013567ffffffffffffffff81111561032f5761032e6105bd565b5b61033b848285016102cd565b91505092915050565b61034d8161047e565b82525050565b600061035e82610462565b610368818561046d565b93506103788185602086016104bf565b610381816105c7565b840191505092915050565b6000610399603d8361046d565b91506103a4826105d8565b604082019050919050565b60006020820190506103c46000830184610344565b92915050565b600060208201905081810360008301526103e48184610353565b905092915050565b600060208201905081810360008301526104058161038c565b9050919050565b6000610416610427565b90506104228282610524565b919050565b6000604051905090565b600067ffffffffffffffff82111561044c5761044b610584565b5b610455826105c7565b9050602081019050919050565b600081519050919050565b600082825260208201905092915050565b600061048982610490565b9050919050565b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b82818337600083830152505050565b60005b838110156104dd5780820151818401526020810190506104c2565b838111156104ec576000848401525b50505050565b6000600282049050600182168061050a57607f821691505b6020821081141561051e5761051d610555565b5b50919050565b61052d826105c7565b810181811067ffffffffffffffff8211171561054c5761054b610584565b5b80604052505050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b600080fd5b600080fd5b600080fd5b600080fd5b6000601f19601f8301169050919050565b7f4f776e65727368697020417373657274696f6e3a2043616c6c6572206f66207460008201527f68652066756e6374696f6e206973206e6f7420746865206f776e65722e00000060208201525056fea2646970667358221220ff9b5a27a0147ce10c5b6c950666755848365d7def32aa74d7b825ae2089022e64736f6c63430008070033`;

    const init = [
      // this parameter is mandatory for all init arrays. Note we use the ETH address here(!)
      {
        vname: '_evm_version',
        type: 'Uint32',
        value: '0',
      },
      {
        vname: 'owner',
        type: 'ByStr20',
        value: `${zilliqa.wallet.defaultAccount.address}`
      },
    ];

    // Instance of class Contract
    const contract = zilliqa.contracts.new(code, init);

    // Deploy the contract.
    // Also notice here we have a default function parameter named toDs as mentioned above.
    // A contract can be deployed at either the shard or at the DS. Always set this value to false.
    const [deployTx, hello] = await contract.deploy(
      {
        version: VERSION,
        gasPrice: myGasPrice,
        gasLimit: Long.fromNumber(6000000),
      },
      33,
      1000,
      false,
    );

    // Introspect the state of the underlying transaction
    console.log(`Deployment Transaction ID: ${deployTx.id}`);
    console.log(`Deployment Transaction Receipt:`);
    console.log(deployTx.txParams.receipt);

    // Get the deployed contract address
    console.log('The contract address is:');
    console.log(hello.address);
    //Following line added to fix issue https://github.com/Zilliqa/Zilliqa-JavaScript-Library/issues/168
    const deployedContract = zilliqa.contracts.at(hello.address);

    // Create a new timebased message and call setHello
    // Also notice here we have a default function parameter named toDs as mentioned above.
    // For calling a smart contract, any transaction can be processed in the DS but not every transaction can be processed in the shards.
    // For those transactions are involved in chain call, the value of toDs should always be true.
    // If a transaction of contract invocation is sent to a shard and if the shard is not allowed to process it, then the transaction will be dropped.
    const newMsg = 'Hello, the time is ' + Date.now();
    console.log('Calling setHello transition with msg: ' + newMsg);
    const callTx = await hello.call(
      'setHello',
      [
        {
          vname: 'msg',
          type: 'String',
          value: newMsg,
        },
      ],
      {
        // amount, gasPrice and gasLimit must be explicitly provided
        version: VERSION,
        amount: new BN(0),
        gasPrice: myGasPrice,
        gasLimit: Long.fromNumber(600000),
      },
      33,
      100,
      false,
    );

    // Retrieving the transaction receipt (See note 2)
    console.log(JSON.stringify(callTx.receipt, null, 4));

    //Get the contract state
    console.log('Getting contract state...');
    const state = await deployedContract.getState();
    console.log('The state of the contract is:');
    console.log(JSON.stringify(state, null, 4));
  } catch (err) {
    console.log(err);
  }
}

// Move X funds to address using private key Y
async function moveFundsFn(amount, toAddr, privateKey) {
  try {
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


async function main() {
  try{
    const zilliqa = new Zilliqa('http://localhost:5555');

    // Genesis private key
    const privateKeyVanilla =
      'db11cfa086b92497c8ed5a4cc6edb3a5bfe3a640c43ffb9fc6aa0873c56f2ee3';

    const  privateKeyEth = 'b87f4ba7dcd6e60f2cca8352c89904e3993c5b2b0b608d255002edcda6374de4';

    //// Get a wallet instance from a private key
    //const EthWallet = Wallet.default.generate();
    //const privateKeyBuffer = EthUtil.toBuffer('0x' + privateKeyVanilla);
    //const wal = Wallet.default.fromPrivateKey(privateKeyBuffer);
    ////const wallet = WalletEth.fromPrivateKey(privateKeyBuffer);

    //// Get a public key
    //const publicKey = wal.getPublicKeyString();
    //console.log(publicKey);


    // New way - add ecdsa wallet
    zilliqa.wallet.addByPrivateKeyECDSA(privateKeyEth);

    const ethAddr = 'df262dbc7d6f68f2a03043d5c99a4ae5a7396ce9'; //zilliqa.wallet.defaultAccount.address;
    //const ethAddr = zilliqa.wallet.defaultAccount.address;
    const address = getAddressFromPrivateKey(privateKeyVanilla);
    const addressIncorrect = getAddressFromPrivateKey(privateKeyEth);

    console.log(`My vanilla account address is: ${address}`);
    console.log(`My eth-style account address is: ${ethAddr}`);
    console.log(`Incorrect eth address with sha256 instead of keccak ${addressIncorrect}`);

    console.log("moving funds from vanilla account to eth account");
    await moveFundsFn('101010', ethAddr, privateKeyVanilla);

    let balance = await zilliqa.blockchain.getBalance(address);
    console.log(`genesis addr balance: ${balance.result.balance}`);

    balance = await zilliqa.blockchain.getBalance(ethAddr);
    console.log(`Eth addr balance: ${balance.result.balance}`);

    console.log("Now proceeding to execute EVM transaction");

    await executeEVMTransaction(privateKeyEth);
  } catch (err) {
    console.log(err);
  }
}

main();

