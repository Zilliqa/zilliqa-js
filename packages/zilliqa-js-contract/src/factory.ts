import hash from 'hash.js';

import { Wallet, Transaction } from '@zilliqa-js/account';
import { Provider, ZilliqaModule } from '@zilliqa-js/core';
import { bytes } from '@zilliqa-js/util';

import { Contract } from './contract';
import { ABI, Init, State } from './types';

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
