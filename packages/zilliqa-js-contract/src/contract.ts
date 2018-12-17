import { Wallet, Transaction, TxStatus } from '@zilliqa-js/account';
import { RPCMethod, Provider, sign } from '@zilliqa-js/core';
import { BN, types } from '@zilliqa-js/util';

import { Contracts } from './factory';
import {
  ABI,
  ContractStatus,
  Init,
  State,
  Value,
  DeployError,
  DeploySuccess,
  CallParams,
  DeployParams,
} from './types';

const NIL_ADDRESS = '0000000000000000000000000000000000000000';

export class Contract {
  factory: Contracts;
  provider: Provider;
  signer: Wallet;

  init: Init;
  abi?: ABI;
  state?: State;
  address?: string;
  code?: string;
  status: ContractStatus;

  constructor(
    factory: Contracts,
    code?: string,
    abi?: ABI,
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

  /**
   * isInitialised
   *
   * Returns true if the contract has not been deployed
   *
   * @returns {boolean}
   */
  isInitialised(): boolean {
    return this.status === ContractStatus.Initialised;
  }

  /**
   * isDeployed
   *
   * Returns true if the contract is deployed
   *
   * @returns {boolean}
   */
  isDeployed(): boolean {
    return this.status === ContractStatus.Deployed;
  }

  /**
   * isRejected
   *
   * Returns true if an attempt to deploy the contract was made, but the
   * underlying transaction was unsuccessful.
   *
   * @returns {boolean}
   */
  isRejected(): boolean {
    return this.status === ContractStatus.Rejected;
  }

  @sign
  async prepareTx(
    tx: Transaction,
    attempts: number = 20,
    interval: number = 1000,
  ): Promise<Transaction> {
    const response = await this.provider.send<DeploySuccess, DeployError>(
      RPCMethod.CreateTransaction,
      tx.txParams,
    );

    return types.isError(response)
      ? tx.setStatus(TxStatus.Rejected)
      : tx.confirm(response.result.TranID);
  }

  /**
   * deploy
   *
   * @param {DeployParams} params
   * @returns {Promise<Contract>}
   */
  async deploy(
    params: DeployParams,
    attempts: number = 20,
    interval: number = 1000,
  ): Promise<Contract> {
    if (!this.code || !this.init) {
      throw new Error(
        'Cannot deploy without code or initialisation parameters.',
      );
    }

    try {
      const tx = await this.prepareTx(
        new Transaction(
          {
            ...params,
            version: 0,
            toAddr: NIL_ADDRESS,
            amount: new BN(0),
            code: this.code,
            data: JSON.stringify(this.init).replace(/\\"/g, '"'),
          },
          this.provider,
        ),
        attempts,
        interval,
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
    args: Value[],
    params: CallParams,
    attempts: number = 20,
    interval: number = 1000,
  ): Promise<Transaction> {
    const data = {
      _tag: transition,
      params: args,
    };

    if (!this.address) {
      return Promise.reject('Contract has not been deployed!');
    }

    try {
      return await this.prepareTx(
        new Transaction(
          {
            ...params,
            version: 0,
            toAddr: this.address,
            data: JSON.stringify(data),
          },
          this.provider,
        ),
        attempts,
        interval,
      );
    } catch (err) {
      throw err;
    }
  }

  async getState(): Promise<State> {
    if (this.status !== ContractStatus.Deployed) {
      return Promise.resolve([]);
    }

    const response = await this.provider.send(
      'GetSmartContractState',
      this.address,
    );

    return response.result;
  }
}
