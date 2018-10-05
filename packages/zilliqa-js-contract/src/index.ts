import BN from 'bn.js';
import hash from 'hash.js';
import {Wallet, Transaction} from 'zilliqa-js-account';
import {Provider, ZilliqaModule, sign} from 'zilliqa-js-core';
import {ABI, Init, State} from './types';

export const enum ContractStatus {
  Deployed,
  Rejected,
  Initialised,
}

/**
 * Contracts
 *
 * Unlike most zilliqa-js modules, `Contracts` is a factory class.
 * As a result, individual `Contract` instances are instead obtained by
 * calling `Contracts.at` (for an already-deployed contract) and
 * `Contracts.new` (to deploy a new contract).
 */
export class Contracts implements ZilliqaModule {
  provider: Provider;
  signer: Wallet;

  constructor(provider: Provider, signer: Wallet) {
    this.provider = provider;
    this.signer = signer;
  }

  at(
    address: string,
    abi: ABI,
    code: string,
    init?: Init,
    state?: State,
  ): Contract {
    return new Contract(this, abi, address, code, init, state);
  }

  new(abi: ABI, code: string, init: Init): Contract {
    return new Contract(this, abi, code, undefined, init);
  }
}

class Contract {
  factory: Contracts;
  provider: Provider;
  signer: Wallet;

  abi: ABI;
  init: Init;
  state?: State;
  address?: string;
  code?: string;
  status: ContractStatus;

  constructor(
    factory: Contracts,
    abi: ABI,
    code: string,
    address?: string,
    init?: any,
    state?: any,
  ) {
    this.factory = factory;
    this.provider = factory.provider;
    this.signer = factory.signer;
    // assume that we are accessing an existing contract
    if (address) {
      this.abi = abi;
      this.address = address;
      this.init = init;
      this.state = state;
      this.status = ContractStatus.Deployed;
    } else {
      // assume we're deploying
      this.abi = abi;
      this.code = code;
      this.init = init;
      this.status = ContractStatus.Initialised;
    }
  }

  @sign
  async prepareTx(tx: Transaction): Promise<Transaction> {
    const raw = tx.return();
    const {code, ...rest} = raw;
    const response = await this.provider.send('CreateTransaction', [
      {...raw, amount: raw.amount.toNumber()},
    ]);

    return tx.confirmReceipt(response.result.TranID);
  }

  async deploy(gasPrice: BN, gasLimit: BN): Promise<Transaction> {
    if (!this.code || !this.init) {
      throw new Error('Cannot deploy without code or ABI.');
    }

    Transaction.setProvider(this.provider);
    try {
      const tx = await this.prepareTx(
        new Transaction({
          version: 0,
          to: '0000000000000000000000000000000000000000',
          // amount should be 0.  we don't accept implicitly anymore.
          amount: new BN(0),
          gasPrice: gasPrice.toNumber(),
          gasLimit: gasPrice.toNumber(),
          code: this.code,
          data: JSON.stringify(this.init).replace(/\\"/g, '"'),
        }),
      );

      return tx.bimap(
        tx => {
          const address = hash
            .sha256()
            .update(tx.pubKey, 'hex')
            .update(tx.nonce as number)
            .digest('hex')
            .slice(-40);

          this.status = ContractStatus.Deployed;
          this.address = address;

          return tx;
        },
        err => {
          this.status = ContractStatus.Rejected;
          throw err;
        },
      );
    } catch (err) {
      throw err;
    }
  }

  call(transition: string, params: any) {}
}
