import BN from 'bn.js';

import { Wallet, Transaction, TxStatus } from '@zilliqa-js/account';
import { RPCMethod, Provider, sign } from '@zilliqa-js/core';
import { types } from '@zilliqa-js/util';

import { Contracts } from './factory';
import {
  ABI,
  ContractStatus,
  Init,
  State,
  Value,
  DeployError,
  DeploySuccess,
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
    code: string,
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

  @sign
  async prepareTx(tx: Transaction): Promise<Transaction> {
    const response = await this.provider.send<DeploySuccess, DeployError>(
      RPCMethod.CreateTransaction,
      tx.txParams,
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
