//  This file is part of Zilliqa-Javascript-Library.
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//   This program is distributed in the hope that it will be useful,
//   but WITHOUT ANY WARRANTY; without even the implied warranty of
//   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//   GNU General Public License for more details.
//
//   You should have received a copy of the GNU General Public License
//   along with this program.  If not, see <https://www.gnu.org/licenses/>.

import { Transaction, TxStatus, Wallet } from '@zilliqa-js/account';
import { GET_TX_ATTEMPTS, Provider, RPCMethod, sign } from '@zilliqa-js/core';
import {
  isValidChecksumAddress,
  normaliseAddress,
  toChecksumAddress,
} from '@zilliqa-js/crypto';
import { BN } from '@zilliqa-js/util';

import { Contracts } from './factory';
import {
  ABI,
  CallParams,
  ContractStatus,
  DeployError,
  DeployParams,
  DeploySuccess,
  Init,
  State,
  Value,
} from './types';

const NIL_ADDRESS = '0x0000000000000000000000000000000000000000';

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
  error?: any;

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
      this.address = normaliseAddress(address);
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
    attempts: number = GET_TX_ATTEMPTS,
    interval: number = 1000,
    isDeploy: boolean,
  ): Promise<Transaction> {
    const response = await this.provider.send<DeploySuccess, DeployError>(
      RPCMethod.CreateTransaction,
      { ...tx.txParams, priority: tx.toDS },
    );

    if (response.error) {
      this.address = undefined;
      this.error = response.error;
      return tx.setStatus(TxStatus.Rejected);
    }

    if (isDeploy) {
      this.address = response.result.ContractAddress
        ? toChecksumAddress(response.result.ContractAddress)
        : undefined;
    }

    return tx.confirm(response.result.TranID, attempts, interval);
  }

  @sign
  async prepare(tx: Transaction): Promise<string | undefined> {
    const response = await this.provider.send<DeploySuccess, DeployError>(
      RPCMethod.CreateTransaction,
      { ...tx.txParams, priority: tx.toDS },
    );

    if (response.error || !response.result) {
      this.address = undefined;
      this.error = response.error;
      tx.setStatus(TxStatus.Rejected);
    } else {
      tx.id = response.result.TranID;
      return response.result.ContractAddress;
    }
  }

  async deployWithoutConfirm(
    params: DeployParams,
    toDs: boolean = false,
  ): Promise<[Transaction, Contract]> {
    if (!this.code || !this.init) {
      throw new Error(
        'Cannot deploy without code or initialisation parameters.',
      );
    }
    const tx = new Transaction(
      {
        ...params,
        toAddr: NIL_ADDRESS,
        amount: new BN(0),
        code: this.code,
        data: JSON.stringify(this.init).replace(/\\"/g, '"'),
      },
      this.provider,
      TxStatus.Initialised,
      toDs,
    );

    this.address = await this.prepare(tx);
    return [tx, this];
  }

  /**
   * deploy
   *
   * @param {DeployParams} params
   * @returns {Promise<Contract>}
   */
  async deploy(
    params: DeployParams,
    attempts: number = 33,
    interval: number = 1000,
    toDs: boolean = false,
  ): Promise<[Transaction, Contract]> {
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
            toAddr: NIL_ADDRESS,
            amount: new BN(0),
            code: this.code,
            data: JSON.stringify(this.init).replace(/\\"/g, '"'),
          },
          this.provider,
          TxStatus.Initialised,
          toDs,
        ),
        attempts,
        interval,
        true,
      );

      if (tx.isRejected()) {
        this.status = ContractStatus.Rejected;
        this.address = undefined;
        return [tx, this];
      }

      this.status = ContractStatus.Deployed;
      this.address =
        this.address && isValidChecksumAddress(this.address)
          ? this.address
          : Contracts.getAddressForContract(tx);

      return [tx, this];
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
    attempts: number = 33,
    interval: number = 1000,
    toDs: boolean = false,
  ): Promise<Transaction> {
    const data = {
      _tag: transition,
      params: args,
    };

    if (this.error) {
      return Promise.reject(this.error);
    }

    if (!this.address) {
      return Promise.reject('Contract has not been deployed!');
    }

    try {
      return await this.prepareTx(
        new Transaction(
          {
            ...params,
            toAddr: this.address,
            data: JSON.stringify(data),
          },
          this.provider,
          TxStatus.Initialised,
          toDs,
        ),
        attempts,
        interval,
        false,
      );
    } catch (err) {
      throw err;
    }
  }

  // FIXME: Link to @zilliqa-js/blockchain package (reuse code)

  async getState(): Promise<State> {
    if (this.status !== ContractStatus.Deployed) {
      return Promise.resolve([]);
    }

    if (!this.address) {
      throw new Error('Cannot get state of uninitialised contract');
    }

    const response = await this.provider.send(
      RPCMethod.GetSmartContractState,
      this.address.replace('0x', '').toLowerCase(),
    );

    return response.result;
  }

  // FIXME: Link to @zilliqa-js/blockchain package (reuse code)

  /**
   * getSubState
   *
   * @param { string } variableName - variable name within the state
   * @param { string[] } indices -  (optional) If the variable is of map type, you can specify an index (or indices)
   * @returns {Promise<RPCResponse<any, string>>}
   */

  async getSubState(variableName: string, indices?: string[]): Promise<State> {
    if (this.status !== ContractStatus.Deployed) {
      return Promise.resolve([]);
    }

    if (!this.address) {
      throw new Error('Cannot get state of uninitialised contract');
    }

    if (!variableName) {
      throw new Error('Variable name required');
    }

    const response = await this.provider.send(
      RPCMethod.GetSmartContractSubState,
      this.address.replace('0x', '').toLowerCase(),
      variableName,
      indices === undefined ? [] : indices,
    );

    return response.result;
  }

  // FIXME: Link to @zilliqa-js/blockchain package (reuse code)

  async getInit(): Promise<State> {
    if (this.status !== ContractStatus.Deployed) {
      return Promise.resolve([]);
    }

    if (!this.address) {
      throw new Error('Cannot get state of uninitialised contract');
    }

    const response = await this.provider.send(
      RPCMethod.GetSmartContractInit,
      this.address.replace('0x', '').toLowerCase(),
    );

    return response.result;
  }
}
