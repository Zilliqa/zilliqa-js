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

const zilliqa = new Zilliqa('http://localhost:5555');

// These are set by the core protocol, and may vary per-chain.
// You can manually pack the bytes according to chain id and msg version.
// For more information: https://apidocs.zilliqa.com/?shell#getnetworkid

const chainId = 1; // chainId of the developer testnet
const msgVersion = 1; // current msgVersion
const VERSION = bytes.pack(chainId, msgVersion);

// Populate the wallet with an account
const privateKey =
    'db11cfa086b92497c8ed5a4cc6edb3a5bfe3a640c43ffb9fc6aa0873c56f2ee3';

zilliqa.wallet.addByPrivateKey(privateKey);

const address = getAddressFromPrivateKey(privateKey);
console.log(`My account address is: ${address}`);
console.log(`My account bech32 address is: ${toBech32Address(address)}`);

async function testBlockchain() {
    try {
        // Get Balance
        const balance = await zilliqa.blockchain.getBalance(address);
        // Get Minimum Gas Price from blockchain
        const minGasPrice = await zilliqa.blockchain.getMinimumGasPrice();

        // Account balance (See note 1)
        console.log(`Your account balance is:`);
        console.log(balance.result);
        console.log(`Current Minimum Gas Price: ${minGasPrice.result}`);
        const myGasPrice = units.toQa('2000', units.Units.Li); // Gas Price that will be used by all transactions
        console.log(`My Gas Price ${myGasPrice.toString()}`);
        const isGasSufficient = myGasPrice.gte(new BN(minGasPrice.result)); // Checks if your gas price is less than the minimum gas price
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
                    amount: new BN(units.toQa('1', units.Units.Zil)), // Sending an amount in Zil (1) and converting the amount to Qa
                    gasPrice: myGasPrice, // Minimum gasPrice veries. Check the `GetMinimumGasPrice` on the blockchain
                    gasLimit: Long.fromNumber(50),
                },
                false,
            ),
        );

        // process confirm
        console.log(`The transaction id is:`, tx.id);
        const confirmedTxn = await tx.confirm(tx.id);

        console.log(`The transaction status is:`);
        console.log(confirmedTxn.receipt);

        // Deploy a contract
        console.log(`Deploying a new contract....`);

        const code = `608060405234801561001057600080fd5b50336000806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555061065d806100606000396000f3fe608060405234801561001057600080fd5b50600436106100415760003560e01c8063435ffe94146100465780638da5cb5b146100625780638da9b77214610080575b600080fd5b610060600480360381019061005b91906102fb565b61009e565b005b61006a61012d565b60405161007791906103af565b60405180910390f35b610088610156565b60405161009591906103ca565b60405180910390f35b3373ffffffffffffffffffffffffffffffffffffffff166100bd61012d565b73ffffffffffffffffffffffffffffffffffffffff1614610113576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161010a906103ec565b60405180910390fd5b80600190805190602001906101299291906101e8565b5050565b60008060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff16905090565b606060018054610165906104f2565b80601f0160208091040260200160405190810160405280929190818152602001828054610191906104f2565b80156101de5780601f106101b3576101008083540402835291602001916101de565b820191906000526020600020905b8154815290600101906020018083116101c157829003601f168201915b5050505050905090565b8280546101f4906104f2565b90600052602060002090601f016020900481019282610216576000855561025d565b82601f1061022f57805160ff191683800117855561025d565b8280016001018555821561025d579182015b8281111561025c578251825591602001919060010190610241565b5b50905061026a919061026e565b5090565b5b8082111561028757600081600090555060010161026f565b5090565b600061029e61029984610431565b61040c565b9050828152602081018484840111156102ba576102b96105b8565b5b6102c58482856104b0565b509392505050565b600082601f8301126102e2576102e16105b3565b5b81356102f284826020860161028b565b91505092915050565b600060208284031215610311576103106105c2565b5b600082013567ffffffffffffffff81111561032f5761032e6105bd565b5b61033b848285016102cd565b91505092915050565b61034d8161047e565b82525050565b600061035e82610462565b610368818561046d565b93506103788185602086016104bf565b610381816105c7565b840191505092915050565b6000610399603d8361046d565b91506103a4826105d8565b604082019050919050565b60006020820190506103c46000830184610344565b92915050565b600060208201905081810360008301526103e48184610353565b905092915050565b600060208201905081810360008301526104058161038c565b9050919050565b6000610416610427565b90506104228282610524565b919050565b6000604051905090565b600067ffffffffffffffff82111561044c5761044b610584565b5b610455826105c7565b9050602081019050919050565b600081519050919050565b600082825260208201905092915050565b600061048982610490565b9050919050565b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b82818337600083830152505050565b60005b838110156104dd5780820151818401526020810190506104c2565b838111156104ec576000848401525b50505050565b6000600282049050600182168061050a57607f821691505b6020821081141561051e5761051d610555565b5b50919050565b61052d826105c7565b810181811067ffffffffffffffff8211171561054c5761054b610584565b5b80604052505050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b600080fd5b600080fd5b600080fd5b600080fd5b6000601f19601f8301169050919050565b7f4f776e65727368697020417373657274696f6e3a2043616c6c6572206f66207460008201527f68652066756e6374696f6e206973206e6f7420746865206f776e65722e00000060208201525056fea2646970667358221220ff9b5a27a0147ce10c5b6c950666755848365d7def32aa74d7b825ae2089022e64736f6c63430008070033`;

        const init = [
            // this parameter is mandatory for all init arrays
            {
                vname: '_evm_version',
                type: 'Uint32',
                value: '0',
            },
            {
                vname: 'owner',
                type: 'ByStr20',
                value: `${address}`
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

testBlockchain();

