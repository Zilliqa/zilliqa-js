import { HTTPProvider, Provider } from '@zilliqa-js/core';
import {
  TransactionFactory,
  Wallet,
  TransactionPool,
} from '@zilliqa-js/account';
import { Contracts } from '@zilliqa-js/contract';
import { Blockchain, Network } from '@zilliqa-js/blockchain';
import { ZilConfig, ChainType, ChainID, PRESETS } from './utils';

export { ZilConfig, ChainType, ChainID, PRESETS };

export class Zilliqa {
  provider: Provider;

  blockchain: Blockchain;
  network: Network;
  contracts: Contracts;
  transactions: TransactionFactory;
  transactionPool: TransactionPool;
  wallet: Wallet;

  get chainType(): string {
    switch (this.provider.chainID) {
      case ChainID.MainNet: {
        return ChainType.MainNet;
      }
      case ChainID.TestNet: {
        return ChainType.TestNet;
      }
      default: {
        return '';
      }
    }
  }
  constructor(setting: string | HTTPProvider | ZilConfig) {
    this.provider =
      setting instanceof HTTPProvider ? setting : this.getConfig(setting);
    this.wallet = new Wallet(this.provider);
    this.blockchain = new Blockchain(this.provider, this.wallet);
    this.network = new Network(this.provider, this.wallet);
    this.contracts = new Contracts(this.provider, this.wallet);
    this.transactions = new TransactionFactory(this.provider, this.wallet);
    this.transactionPool = new TransactionPool(this.provider, this.wallet);
  }

  getConfig(setting: string | ZilConfig): Provider {
    if (typeof setting === 'string') {
      return new HTTPProvider(setting, ChainID.MainNet);
    }
    const { chainID, endpoint } = setting;
    return new HTTPProvider(endpoint, chainID);
  }
}
