import { Account, Transaction, Wallet } from '@zilliqa-js/account';
import { Blockchain } from '@zilliqa-js/blockchain';
import { HTTPProvider } from '@zilliqa-js/core';
import { toChecksumAddress, normaliseAddress } from '@zilliqa-js/crypto';
import { BN, Long, bytes, units } from '@zilliqa-js/util';
import { Contracts, Contract, ContractStatus, Value } from '../src/index';
import { testContract, zrc20, simpleDEX as dex, touchAndPay } from './fixtures';

const CHAIN_ID: number = parseInt(process.env.CHAIN_ID as string, 10);
const MSG_VERSION = 1;
const VERSION = bytes.pack(CHAIN_ID, MSG_VERSION);
const MIN_GAS_PRICE = new BN(1000000000);
const MIN_GAS_LIMIT = Long.fromNumber(1);

const provider = new HTTPProvider(process.env.HTTP_PROVIDER as string);
const accounts = [new Account(process.env.GENESIS_PRIV_KEY as string)];
const wallet = new Wallet(provider, accounts);
const blockchain = new Blockchain(provider, wallet);
const contractFactory = new Contracts(provider, wallet);

jest.setTimeout(720000);

const GENESIS_ADDRESS = normaliseAddress(process.env.GENESIS_ADDRESS!);

describe('Contract: touch and pay', () => {
  it('should fail with a receipt if data is not provided during deployment', async () => {
    try {
      await contractFactory.new(touchAndPay, '' as any).deploy(
        {
          version: VERSION,
          gasPrice: new BN(1000000000),
          gasLimit: Long.fromNumber(5000),
        },
        38,
        1000,
      );
    } catch (err) {
      expect(err).toBeDefined();
    }
  });

  it('should not not cause subsequent transactions to fail', async () => {
    const numTx = 5;
    const nonceRes = await blockchain.getBalance(GENESIS_ADDRESS);
    const txns: any[] = [];

    for (let i = nonceRes.result.nonce + 1; i <= numTx; i++) {
      txns.push(
        blockchain.createTransaction(
          new Transaction(
            {
              version: bytes.pack(CHAIN_ID, 1),
              toAddr: toChecksumAddress(
                'd11238e5fcd70c817c22922c500830d00bc1e778',
              ),
              amount: new BN(888),
              gasPrice: new BN(1000000000),
              gasLimit: Long.fromNumber(1),
              nonce: i,
            },
            provider,
          ),
        ),
      );
    }

    const confirmations = await Promise.all(txns);
    confirmations.forEach((conf) => {
      expect(conf.receipt.success).toBe(true);
    });
  });
});

describe('Contract: hello world', () => {
  let address: string;

  it('should be able to deploy the contract', async () => {
    const [tx, contract] = await contractFactory
      .new(testContract, [
        {
          vname: 'owner',
          type: 'ByStr20',
          value: GENESIS_ADDRESS,
        },
        {
          vname: '_scilla_version',
          type: 'Uint32',
          value: '0',
        },
      ])
      .deploy(
        {
          version: VERSION,
          gasPrice: new BN(1000000000),
          gasLimit: Long.fromNumber(5000),
        },
        38,
        1000,
      );

    address = <string>contract.address;
    console.log(`Hello world address: ${address}`);

    expect(tx.isConfirmed()).toBeTruthy();
    expect(contract.status).toEqual(ContractStatus.Deployed);
  });

  it('should be able to call setHello', async () => {
    const contract = contractFactory.at(address);
    // now let's transfer some tokens
    const call = await contract.call(
      'setHello',
      [
        {
          vname: 'msg',
          type: 'String',
          value: 'Hello World',
        },
      ],
      {
        version: VERSION,
        amount: new BN(0),
        gasPrice: new BN(1000000000),
        gasLimit: Long.fromNumber(5000),
      },
      38,
      1000,
      false,
    );

    expect(call.txParams.receipt && call.txParams.receipt.success).toBeTruthy();

    const state = await contract.getState();

    expect(state['welcome_msg']).toEqual('Hello World');
  });

  it('should be rejected by the server if a non-existent contract is called', async () => {
    // setup a non-existent address
    const contract = contractFactory.at(`0x${'0123456789'.repeat(4)}`);
    const call = await contract.call(
      'setHello',
      [
        {
          vname: 'msg',
          type: 'String',
          value: 'Hello World',
        },
      ],
      {
        version: VERSION,
        amount: new BN(0),
        gasPrice: new BN(1000000000),
        gasLimit: Long.fromNumber(1000),
      },
    );

    expect(call.isRejected()).toBeTruthy();
  });
});

describe('Contract: Simple DEX', () => {
  // accounts
  const banker: Account = wallet.accounts[GENESIS_ADDRESS];
  let simpleDexOwner: Account;
  let token1Owner: Account;
  let token2Owner: Account;
  let token1Holder: Account;
  let token2Holder: Account;

  // contracts
  let token1: Contract;
  let token2: Contract;
  let simpleDEX: Contract;

  let cumulativeGasTotal = 0;

  it('distributes tokens first', async () => {
    const mnemonic = process.env.MNEMONIC as string;
    const actors: Account[] = [];

    for (let i = 0; i < 5; i++) {
      const address = wallet.addByMnemonic(mnemonic, i);
      actors.push(wallet.accounts[address]);
    }

    // set up 5 accounts: simple-dex owner, token1 owner, token2 owner, token1 holder, token2 holder
    [
      simpleDexOwner,
      token1Owner,
      token2Owner,
      token1Holder,
      token2Holder,
    ] = actors;

    const balance = await blockchain.getBalance(banker.address);

    if (balance.error) {
      throw new Error(balance.error.message);
    }

    // distribute tokens to all 5 accounts
    return Promise.all(
      actors.map((actor, i) => {
        const tx = new Transaction(
          {
            version: VERSION,
            nonce: balance.result.nonce + i + 1,
            pubKey: banker.publicKey,
            toAddr: actor.address,
            amount: units.toQa(1000000, units.Units.Zil),
            gasPrice: MIN_GAS_PRICE,
            gasLimit: MIN_GAS_LIMIT,
          },
          provider,
          undefined,
          true,
        );

        return blockchain.createTransaction(tx, 33, 1500);
      }),
    );

    console.log('Distributed tokens.');
  });

  // deploy our contracts;
  it('deploys all the necessary contracts', async () => {
    const res = await Promise.all([
      contractFactory
        .new(zrc20, [
          { vname: '_scilla_version', type: 'Uint32', value: '0' },
          {
            vname: 'owner',
            type: 'ByStr20',
            value: token1Owner.address,
          },
          { vname: 'total_tokens', type: 'Uint128', value: '888888888888888' },
        ])
        .deploy({
          version: VERSION,
          pubKey: token1Owner.publicKey,
          gasPrice: new BN(1000000000),
          gasLimit: Long.fromNumber(100000),
        }),
      contractFactory
        .new(zrc20, [
          { vname: '_scilla_version', type: 'Uint32', value: '0' },
          {
            vname: 'owner',
            type: 'ByStr20',
            value: token2Owner.address,
          },
          { vname: 'total_tokens', type: 'Uint128', value: '888888888888888' },
        ])
        .deploy({
          version: VERSION,
          pubKey: token2Owner.publicKey,
          gasPrice: new BN(1000000000),
          gasLimit: Long.fromNumber(100000),
        }),
      contractFactory
        .new(dex, [
          { vname: '_scilla_version', type: 'Uint32', value: '0' },
          {
            vname: 'contractOwner',
            type: 'ByStr20',
            value: simpleDexOwner.address,
          },
        ])
        .deploy({
          version: VERSION,
          pubKey: simpleDexOwner.publicKey,
          gasPrice: new BN(1000000000),
          gasLimit: Long.fromNumber(100000),
        }),
    ]);

    res.forEach(([tx, ct]) => {
      if (tx.txParams.receipt) {
        // @ts-ignore
        cumulativeGasTotal += parseInt(tx.txParams.receipt.cumulative_gas, 10);
      }

      expect(tx.isConfirmed()).toBe(true);
    });

    [[, token1], [, token2], [, simpleDEX]] = res;
  });

  // transfer tokens from owners to holders
  it('distributes tokens to hodlers', async () => {
    const [xfer1, xfer2] = await Promise.all([
      token1.call(
        'Transfer',
        [
          { vname: 'to', type: 'ByStr20', value: token1Holder.address },
          { vname: 'tokens', type: 'Uint128', value: '888' },
        ],
        {
          version: VERSION,
          pubKey: token1Owner.publicKey,
          amount: new BN(0),
          gasPrice: new BN(1000000000),
          gasLimit: Long.fromNumber(10000),
        },
      ),
      token2.call(
        'Transfer',
        [
          { vname: 'to', type: 'ByStr20', value: token2Holder.address },
          { vname: 'tokens', type: 'Uint128', value: '888' },
        ],
        {
          version: VERSION,
          pubKey: token2Owner.publicKey,
          amount: new BN(0),
          gasPrice: new BN(1000000000),
          gasLimit: Long.fromNumber(10000),
        },
      ),
    ]);

    if (xfer1.txParams.receipt) {
      // @ts-ignore
      cumulativeGasTotal += parseInt(xfer1.txParams.receipt.cumulative_gas, 10);
    }

    if (xfer2.txParams.receipt) {
      // @ts-ignore
      cumulativeGasTotal += parseInt(xfer2.txParams.receipt.cumulative_gas, 10);
    }

    expect(xfer1.isConfirmed()).toBe(true);
    expect(xfer2.isConfirmed()).toBe(true);

    // call approve
    const [approveA, approveB] = await Promise.all([
      token1.call(
        'Approve',
        [
          {
            vname: 'spender',
            type: 'ByStr20',
            value: simpleDEX.address as string,
          },
          {
            vname: 'tokens',
            type: 'Uint128',
            value: '168',
          },
        ],
        {
          version: VERSION,
          pubKey: token1Holder.publicKey,
          amount: new BN(0),
          gasPrice: new BN(1000000000),
          gasLimit: Long.fromNumber(5000),
        },
      ),
      token2.call(
        'Approve',
        [
          {
            vname: 'spender',
            type: 'ByStr20',
            value: simpleDEX.address as string,
          },
          {
            vname: 'tokens',
            type: 'Uint128',
            value: '168',
          },
        ],
        {
          version: VERSION,
          pubKey: token2Holder.publicKey,
          amount: new BN(0),
          gasPrice: new BN(1000000000),
          gasLimit: Long.fromNumber(10000),
        },
      ),
    ]);

    if (approveA.txParams.receipt) {
      cumulativeGasTotal += parseInt(
        // @ts-ignore
        approveA.txParams.receipt.cumulative_gas,
        10,
      );
    }

    if (approveB.txParams.receipt) {
      cumulativeGasTotal += parseInt(
        // @ts-ignore
        approveB.txParams.receipt.cumulative_gas,
        10,
      );
    }

    expect(approveA.isConfirmed()).toBe(true);
    expect(approveB.isConfirmed()).toBe(true);
  });

  it('can createOrder and fillOrder', async () => {
    // create an order
    const createOrder = await simpleDEX.call(
      'makeOrder',
      [
        {
          vname: 'tokenA',
          type: 'ByStr20',
          value: token1.address as string,
        },
        {
          vname: 'valueA',
          type: 'Uint128',
          value: '88',
        },
        {
          vname: 'tokenB',
          type: 'ByStr20',
          value: token2.address as string,
        },
        {
          vname: 'valueB',
          type: 'Uint128',
          value: '88',
        },
        {
          vname: 'expirationBlock',
          type: 'BNum',
          value: '500000000',
        },
      ],
      {
        version: VERSION,
        pubKey: token1Holder.publicKey,
        amount: new BN(0),
        gasPrice: new BN(1000000000),
        gasLimit: Long.fromNumber(100000),
      },
      38,
      1000,
      true,
    );

    if (createOrder.txParams.receipt) {
      cumulativeGasTotal += parseInt(
        // @ts-ignore
        createOrder.txParams.receipt.cumulative_gas,
        10,
      );
    }

    expect(createOrder.isConfirmed()).toBe(true);

    // check states
    const state = await simpleDEX.getState();
    expect(state.length).toBeGreaterThan(0);
  });

  afterAll(() => {
    console.log('Total gas consumed: ', cumulativeGasTotal);
  });
});

describe('Contract: HWGC', async () => {
  it('should not change the balance of contracts when the callee does not accept', async () => {
    const getContractBalance = (state: Value[]): number => {
      const [balance] = state
        .filter(({ vname }) => vname === '_balance')
        .map(({ value }) => parseInt(<string>value, 10));

      return balance;
    };

    try {
      // Deploy contract 1
      const code1 = `scilla_version 0
    library ChainChain1
    
    let one_msg = 
        fun (msg : Message) => 
        let nil_msg = Nil {Message} in
        Cons {Message} msg nil_msg
    
    contract ChainChain1
    (owner : ByStr20)
    
    field contract2_add : Option ByStr20 = None {ByStr20}
    
    transition deposit ()
        accept;
        e = {_eventname : "Deposited"};
        event e
    end
    
    transition setAdd (currentContractAdd : ByStr20)
        c2add <- contract2_add;
        match c2add with
        | Some v =>
            e = {_eventname : "AddressSetStatus"; msg : "Failed!"};
            event e
        | None =>
            new_contract2_add = Some {ByStr20} currentContractAdd;
            contract2_add := new_contract2_add;
            e = {_eventname : "AddressSetStatus"; msg : "Success!"};
            event e
        end
    end
        
    transition Transfer1 ()
        c2add <- contract2_add;
        match c2add with
        | Some v =>
            e = {_eventname : "First"};
            event e;
            msg = {_tag : "Transfer2"; _recipient : v; _amount : Uint128 1000};
            msgs = one_msg msg;
            send msgs
        | None =>
            e = {_eventname : "Transfer1Failed"};
            event e
        end
    end`;

      const code2 = `scilla_version 0
    library ChainChain2
    
    let one_msg = 
        fun (msg : Message) => 
        let nil_msg = Nil {Message} in
        Cons {Message} msg nil_msg
    
    contract ChainChain2
    (owner : ByStr20)
    
    field contract3_add : Option ByStr20 = None {ByStr20}
    
    transition setAdd (currentContractAdd : ByStr20)
        c3add <- contract3_add;
        match c3add with
        | Some v =>
            e = {_eventname : "AddressSetStatus"; msg : "Failed!"};
            event e
        | None =>
            new_contract3_add = Some {ByStr20} currentContractAdd;
            contract3_add := new_contract3_add;
            e = {_eventname : "AddressSetStatus"; msg : "Success!"};
            event e
        end
    end
    
    transition Transfer2 ()
        c3add <- contract3_add;
        match c3add with
        | Some v =>
            accept;
            e = {_eventname : "Second"};
            event e;
            msg = {_tag : "Transfer3"; _recipient : v; _amount : Uint128 500};
            msgs = one_msg msg;
            send msgs
        | None =>
            e = {_eventname : "Transfer2Failed"};
            event e
        end
    end`;

      const code3 = `scilla_version 0
    library ChainChain3
    
    let one_msg = 
        fun (msg : Message) => 
        let nil_msg = Nil {Message} in
        Cons {Message} msg nil_msg
    
    contract ChainChain3
    (owner : ByStr20)
    
    transition Transfer3 ()
        e = {_eventname : "Third"};
        event e
    end`;

      const init = [
        // this parameter is mandatory for all init arrays
        {
          vname: '_scilla_version',
          type: 'Uint32',
          value: '0',
        },
        {
          vname: 'owner',
          type: 'ByStr20',
          // NOTE: all byte strings passed to Scilla contracts _must_ be
          // prefixed with 0x. Failure to do so will result in the network
          // rejecting the transaction while consuming gas!
          value: GENESIS_ADDRESS,
        },
      ];

      // Instance of class Contract 1
      const contract1 = contractFactory.new(code1, init);

      // Deploy contract 1
      const [deployTx1, chainchain1] = await contract1.deploy(
        {
          version: VERSION,
          gasPrice: units.toQa('1000', units.Units.Li), // Minimum gasPrice measured in Li, converting to Qa.
          gasLimit: Long.fromNumber(10000),
        },
        38,
        1000,
      );

      // Introspect the state of the underlying transaction
      console.log('Deployment 1 Transaction ID: ', deployTx1.id);
      console.log(
        'Deployment 1 Transaction Receipt: ',
        deployTx1.txParams.receipt,
      );

      // Get the deployed contract address
      console.log('1st contract address is:');
      console.log(chainchain1.address);
      // const cadd1 = `0x${chainchain1.address}`;

      // Instance of class Contract 2
      const contract2 = contractFactory.new(code2, init);
      // Deploy contract 2
      const [deployTx2, chainchain2] = await contract2.deploy(
        {
          version: VERSION,
          gasPrice: units.toQa('1000', units.Units.Li), // Minimum gasPrice measured in Li, converting to Qa.
          gasLimit: Long.fromNumber(10000),
        },
        38,
        1000,
      );

      // Introspect the state of the underlying transaction
      console.log('Deployment 2 Transaction ID: ', deployTx2.id);
      console.log(
        'Deployment 2 Transaction Receipt: ',
        deployTx2.txParams.receipt,
      );

      // Get the deployed contract address
      console.log('2nd contract address is:');
      console.log(chainchain2.address);

      // Instance of class Contract 3
      const contract3 = contractFactory.new(code3, init);
      // Deploy contract 3
      const [deployTx3, chainchain3] = await contract3.deploy(
        {
          version: VERSION,
          gasPrice: units.toQa('1000', units.Units.Li), // Minimum gasPrice measured in Li, converting to Qa.
          gasLimit: Long.fromNumber(10000),
        },
        38,
        1000,
      );

      // Introspect the state of the underlying transaction
      console.log('Deployment 3 Transaction ID: ', deployTx3.id);
      console.log(
        'Deployment 3 Transaction Receipt: ',
        deployTx3.txParams.receipt,
      );

      // Get the deployed contract address
      console.log('3rd contract address is:');
      console.log(chainchain3.address);

      // setAdd in contract 1 for contract 2
      const callTx1 = await chainchain1.call(
        'setAdd',
        [
          {
            vname: 'currentContractAdd',
            type: 'ByStr20',
            value: chainchain2.address as string,
          },
        ],
        {
          // version, amount, gasPrice and gasLimit must be explicitly provided
          version: VERSION,
          amount: new BN(0),
          gasPrice: units.toQa('1000', units.Units.Li), // Minimum gasPrice measured in Li, converting to Qa.
          gasLimit: Long.fromNumber(8000),
        },
        38,
        1000,
        true,
      );

      // Get the call txn info
      console.log('SetAdd_A Call Transaction ID: ', callTx1.id);
      console.log(
        'SetAdd_A Call Transaction Receipt: ',
        callTx1.txParams.receipt,
      );

      // Get the contract A setAdd state
      const state1 = await chainchain1.getState();
      console.log('The state of the contract 1 is:');
      console.log(state1);

      // setAdd in contract 2 for contract 3
      const callTx2 = await chainchain2.call(
        'setAdd',
        [
          {
            vname: 'currentContractAdd',
            type: 'ByStr20',
            value: chainchain3.address as string,
          },
        ],
        {
          // version, amount, gasPrice and gasLimit must be explicitly provided
          version: VERSION,
          amount: new BN(0),
          gasPrice: units.toQa('1000', units.Units.Li), // Minimum gasPrice measured in Li, converting to Qa.
          gasLimit: Long.fromNumber(8000),
        },
        38,
        1000,
        true,
      );

      // Get the call txn info
      console.log('SetAdd_B Call Transaction ID: ', callTx2.id);
      console.log(
        'SetAdd_B Call Transaction Receipt: ',
        callTx2.txParams.receipt,
      );

      // Get the contract B setAdd state
      const state2 = await chainchain2.getState();
      console.log('The state of the contract 2 is:');
      console.log(state2);

      // Initial deposit in contract 1
      const callTx3 = await chainchain1.call(
        'deposit',
        [],
        {
          // version, amount, gasPrice and gasLimit must be explicitly provided
          version: VERSION,
          amount: new BN(10000),
          gasPrice: units.toQa('1000', units.Units.Li), // Minimum gasPrice measured in Li, converting to Qa.
          gasLimit: Long.fromNumber(8000),
        },
        38,
        1000,
        true,
      );

      // Get the call txn info
      console.log('Deposit_A Call Transaction ID: ', callTx3.id);
      console.log(
        'Deposit_A Call Transaction Receipt: ',
        callTx3.txParams.receipt,
      );

      // Get the contract A deposit state
      const state3 = await chainchain1.getState();
      console.log('The state of the contract is:');
      console.log(state3);

      // Chain calls (Transfer1 in C1 -> Transfer2 in C2 -> Transfer3 in C3)
      const callTx4 = await chainchain1.call(
        'Transfer1',
        [],
        {
          // version, amount, gasPrice and gasLimit must be explicitly provided
          version: VERSION,
          amount: new BN(0),
          gasPrice: units.toQa('1000', units.Units.Li), // Minimum gasPrice measured in Li, converting to Qa.
          gasLimit: Long.fromNumber(8000),
        },
        38,
        1000,
        true,
      );

      // Get the call txn info
      console.log('Transfer Chain-Call Transaction ID: ', callTx4.id);
      console.log(
        'Transfer Chain-Call Transaction Receipt: ',
        callTx4.txParams.receipt,
      );

      // Get the final contracts' states
      // _balance should be 9000
      const state4 = await chainchain1.getState();
      const state4Balance = getContractBalance(state4);
      console.log('The end state of the contract A is:');
      console.log(state4);
      expect(state4Balance).toEqual(9000);

      // _balance should be 1000
      const state5 = await chainchain2.getState();
      const state5Balance = getContractBalance(state5);
      console.log('The end state of the contract B is:');
      console.log(state5);
      expect(state5Balance).toEqual(1000);

      // _balance should be 0
      const state6 = await chainchain3.getState();
      const state6Balance = getContractBalance(state6);
      console.log('The end state of the contract C is:');
      console.log(state6);
      expect(state6Balance).toEqual(0);
    } catch (err) {
      expect(err).toBe(null);
    }
  });
});
