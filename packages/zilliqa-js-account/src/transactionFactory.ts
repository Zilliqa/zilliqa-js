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

import { Provider, RPCMethod, ZilliqaModule } from '@zilliqa-js/core';
import { Transaction } from './transaction';
import { TxParams, TxStatus } from './types';
import { formatOutgoingTx } from './util';
import { Wallet } from './wallet';

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

  new(txParams: TxParams, toDs: boolean = false) {
    return new Transaction(txParams, this.provider, TxStatus.Initialised, toDs);
  }
}
