import BN from 'bn.js';
import hash from 'hash.js';

import {
  Account,
  Wallet,
  Transaction,
  TxStatus,
} from '@zilliqa/zilliqa-js-account';
import {Provider, ZilliqaModule, sign} from '@zilliqa/zilliqa-js-core';
import {bytes, types} from '@zilliqa/zilliqa-js-util';

import {ABI, Init, State, Value, DeployError, DeploySuccess} from './types';

const NIL_ADDRESS = '0000000000000000000000000000000000000000';

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
  /**
   * getAddressForContract
   *
   * @static
   * @param {string} deployer - address of the contract deployer
   * @param {Transaction} tx - transaction used to create the contract
   * @returns {string} - the contract address
   */
  static getAddressForContract(tx: Transaction): string {
    // always subtract 1 from the tx nonce, as contract addresses are computed
    // based on the nonce in the global state.
    const nonce = tx.txParams.nonce ? tx.txParams.nonce - 1 : 0;

    return hash
      .sha256()
      .update(tx.senderAddress, 'hex')
      .update(bytes.intToHexArray(nonce, 64).join(''), 'hex')
      .digest('hex')
      .slice(24);
  }

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

export class Contract {
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
    const payload = tx.payload;
    const {code, ...rest} = payload;
    const response = await this.provider.send<DeploySuccess, DeployError>(
      'CreateTransaction',
      [payload],
    );

    return types.isError(response)
      ? tx.setStatus(TxStatus.Rejected)
      : tx.confirm(response.result.TranID);
  }

  async deploy(gasPrice: BN, gasLimit: BN): Promise<Contract> {
    if (!this.code || !this.init) {
      throw new Error(
        'Cannot deploy without code or initialisation parameters.',
      );
    }

    try {
      const tx = await this.prepareTx(
        new Transaction(
          {
            version: 0,
            toAddr: NIL_ADDRESS,
            // amount should be 0.  we don't accept implicitly anymore.
            amount: new BN(0),
            gasPrice,
            gasLimit,
            code: this.code,
            data: JSON.stringify(this.init).replace(/\\"/g, '"'),
          },
          this.provider,
        ),
      );

      if (tx.isRejected()) {
        this.status = ContractStatus.Rejected;
        return this;
      }

      this.status = ContractStatus.Deployed;
      this.address = Contracts.getAddressForContract(tx);

      return this;
    } catch (err) {
      throw err;
    }
  }

  /**
   * call
   *
   * @param {string} transition
   * @param {any} params
   * @returns {Promise<Transaction>}
   */
  async call(
    transition: string,
    params: Value[],
    amount: BN = new BN(0),
    gasLimit: BN = new BN(1000),
    gasPrice: BN = new BN(10),
  ): Promise<Transaction> {
    const msg = {
      _tag: transition,
      // TODO: this should be string, but is not yet supported by lookup.
      params,
    };

    if (!this.address) {
      return Promise.reject('Contract has not been deployed!');
    }

    try {
      return await this.prepareTx(
        new Transaction(
          {
            version: 0,
            toAddr: this.address,
            amount: new BN(0),
            gasPrice,
            gasLimit,
            data: JSON.stringify(msg),
          },
          this.provider,
        ),
      );
    } catch (err) {
      throw err;
    }
  }

  async getState(): Promise<State> {
    if (this.status !== ContractStatus.Deployed) {
      return Promise.resolve([]);
    }

    const response = await this.provider.send('GetSmartContractState', [
      this.address,
    ]);

    return response.result;
  }
}
