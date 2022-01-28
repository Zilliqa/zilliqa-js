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

import { Provider, RPCMethod, ZilliqaModule } from '@zilliqa-js/core';
import { Transaction } from './transaction';
import { TxParams, TxStatus } from './types';
import { formatOutgoingTx } from './util';
import { Wallet } from './wallet';
import { BN } from '@zilliqa-js/util';

export class TransactionFactory implements ZilliqaModule {
  provider: Provider;
  signer: Wallet;

  constructor(provider: Provider, signer: Wallet) {
    this.provider = provider;
    this.provider.middleware.request.use(
      formatOutgoingTx,
      RPCMethod.CreateTransaction,
    );
    this.signer = signer;
  }

  new(
    txParams: TxParams,
    toDs: boolean = false,
    enableSecureAddress: boolean = true,
  ) {
    return new Transaction(
      txParams,
      this.provider,
      TxStatus.Initialised,
      toDs,
      enableSecureAddress,
    );
  }

  /**
   * This constructor could help you to check if there is a default account to be used, and further more, if it has
   * sufficient fund to do the transfer.
   * @param txParams
   */
  async payment(txParams: TxParams) {
    const defaultAccount = this.signer.defaultAccount;
    if (defaultAccount !== undefined) {
      const addr = defaultAccount.address;
      const response = await this.provider.send(
        RPCMethod.GetBalance,
        addr.replace('0x', '').toLowerCase(),
      );
      if (response.error) {
        throw response.error;
      }
      const fund = new BN(response.result.balance);
      if (txParams.amount.cmp(fund) === 1) {
        throw new Error('No sufficient fund');
      }
    } else {
      throw new Error('No default wallet');
    }
    return this.new(txParams, true);
  }
}
