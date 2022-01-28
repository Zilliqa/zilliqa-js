//  Copyright (C) 2018 Zilliqa
//
//  This file is part of zilliqa-js
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

import hash from 'hash.js';

import { Wallet, Transaction, util } from '@zilliqa-js/account';
import { toChecksumAddress } from '@zilliqa-js/crypto';
import { Provider, RPCMethod, ZilliqaModule } from '@zilliqa-js/core';
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
   * @param {Transaction} tx - transaction used to create the contract
   * @returns {string} - the contract address
   */
  static getAddressForContract(tx: Transaction): string {
    // always subtract 1 from the tx nonce, as contract addresses are computed
    // based on the nonce in the global state.
    const nonce = tx.txParams.nonce ? tx.txParams.nonce - 1 : 0;

    return toChecksumAddress(
      hash
        .sha256()
        .update(tx.senderAddress.replace('0x', '').toLowerCase(), 'hex')
        .update(bytes.intToHexArray(nonce, 16).join(''), 'hex')
        .digest('hex')
        .slice(24),
    );
  }

  provider: Provider;
  signer: Wallet;

  constructor(provider: Provider, signer: Wallet) {
    this.provider = provider;
    this.provider.middleware.request.use(
      util.formatOutgoingTx,
      RPCMethod.CreateTransaction,
    );
    this.signer = signer;
  }

  at(
    address: string,
    abi?: ABI,
    code?: string,
    init?: Init,
    state?: State,
  ): Contract {
    return new Contract(this, code, abi, address, init, state);
  }

  atBech32(
    address: string,
    abi?: ABI,
    code?: string,
    init?: Init,
    state?: State,
  ): Contract {
    return new Contract(this, code, abi, address, init, state, true);
  }

  new(code: string, init: Init, abi?: ABI): Contract {
    return new Contract(this, code, abi, undefined, init);
  }
}
