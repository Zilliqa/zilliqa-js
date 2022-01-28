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

import { HTTPProvider, Provider } from '@zilliqa-js/core';
import { TransactionFactory, Wallet } from '@zilliqa-js/account';
import { Contracts } from '@zilliqa-js/contract';
import { Blockchain, Network } from '@zilliqa-js/blockchain';
import { SubscriptionBuilder } from '@zilliqa-js/subscriptions';
export * from '@zilliqa-js/util';
export * from '@zilliqa-js/crypto';
export * from '@zilliqa-js/subscriptions';

export class Zilliqa {
  provider: Provider;
  blockchain: Blockchain;
  network: Network;
  contracts: Contracts;
  transactions: TransactionFactory;
  wallet: Wallet;
  subscriptionBuilder: SubscriptionBuilder;

  constructor(node: string, provider?: Provider) {
    this.provider = provider || new HTTPProvider(node);
    this.wallet = new Wallet(this.provider);
    this.blockchain = new Blockchain(this.provider, this.wallet);
    this.network = new Network(this.provider, this.wallet);
    this.contracts = new Contracts(this.provider, this.wallet);
    this.transactions = new TransactionFactory(this.provider, this.wallet);
    this.subscriptionBuilder = new SubscriptionBuilder();
  }
}
