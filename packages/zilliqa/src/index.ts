import { HTTPProvider, Provider } from '@zilliqa-js/core';
import { TransactionFactory, Wallet } from '@zilliqa-js/account';
import { Contracts } from '@zilliqa-js/contract';
import { Blockchain, Network } from '@zilliqa-js/blockchain';
import { HRP, tHRP } from '@zilliqa-js/crypto';
import { ZilConfig, ChainType, ChainID } from './utils';

export class Zilliqa {
  provider: Provider;

  blockchain: Blockchain;
  network: Network;
  contracts: Contracts;
  transactions: TransactionFactory;
  wallet: Wallet;

  constructor(node: string, provider?: Provider, config?: ZilConfig) {
    let zilProvider;

    if (config) {
      const zilConfig = this.getConfig(config);
      zilProvider = zilConfig.provider;
    }

    this.provider =
      provider || zilProvider || new HTTPProvider(node, ChainID.MainNet);
    this.wallet = new Wallet(this.provider);
    this.blockchain = new Blockchain(this.provider, this.wallet);
    this.network = new Network(this.provider, this.wallet);
    this.contracts = new Contracts(this.provider, this.wallet);
    this.transactions = new TransactionFactory(this.provider, this.wallet);
  }

  getConfig(config: ZilConfig) {
    const { chainType, endpoint } = config;
    let chainID = ChainID.MainNet;
    let hrp = HRP;

    switch (chainType) {
      case ChainType.MainNet: {
        chainID = ChainID.MainNet;
        hrp = HRP;
        break;
      }
      case ChainType.TestNet: {
        chainID = ChainID.TestNet;
        hrp = tHRP;
        break;
      }
      default:
        break;
    }
    const provider = new HTTPProvider(endpoint, chainID);
    return { provider, chainID, hrp };
  }
}
