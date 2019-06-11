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

import { HTTPProvider, Provider } from '@zilliqa-js/core';
import { TransactionFactory, Wallet } from '@zilliqa-js/account';
import { Contracts } from '@zilliqa-js/contract';
import { Blockchain, Network } from '@zilliqa-js/blockchain';
import { bytes } from '@zilliqa-js/util';
import {
  ChainId,
  MsgVersion,
  NetworkType,
  ProviderUrl,
} from '@zilliqa-js/util/dist/presets';

export class Zilliqa {
  provider: Provider;

  blockchain: Blockchain;
  network: Network;
  contracts: Contracts;
  transactions: TransactionFactory;
  wallet: Wallet;

  constructor(network: NetworkType) {
    let nodeUrl = 'https://api.zilliqa.com';
    let chainId = 1;
    switch (network) {
      case NetworkType.MainNet:
        nodeUrl = ProviderUrl.MainNet;
        chainId = ChainId.MainNet;
        break;
      case NetworkType.TestNet:
        nodeUrl = ProviderUrl.TestNet;
        chainId = ChainId.TestNet;
        break;
    }

    const version = bytes.pack(chainId, MsgVersion);

    this.provider = new HTTPProvider(nodeUrl);
    this.wallet = new Wallet(this.provider);
    this.blockchain = new Blockchain(this.provider, this.wallet);
    this.network = new Network(this.provider, this.wallet);
    this.contracts = new Contracts(this.provider, this.wallet);
    this.transactions = new TransactionFactory(
      this.provider,
      this.wallet,
      version,
    );
  }
}
