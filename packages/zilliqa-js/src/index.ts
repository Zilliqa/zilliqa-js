import {HTTPProvider, Provider} from 'zilliqa-js-core';
import {Wallet} from 'zilliqa-js-account';
import {Contracts} from 'zilliqa-js-contract';
import {Blockchain, Network} from 'zilliqa-js-blockchain';

export default class Zilliqa {
  static provider: Provider;
  static setProvider(provider: Provider) {
    Zilliqa.setProvider(provider);
  }

  provider: Provider;

  blockchain: Blockchain;
  contracts: Contracts;
  network: Network;
  wallet: Wallet;

  constructor(node: string, provider?: Provider) {
    // TODO: we need to perform duck typing here.
    if (provider) {
      Zilliqa.setProvider(provider);
      this.provider = provider;
    } else {
      this.provider = new HTTPProvider(node);
      Zilliqa.setProvider(this.provider);
    }

    this.wallet = new Wallet([]);
    this.blockchain = new Blockchain(this.provider, this.wallet);
    this.contracts = new Contracts(this.provider, this.wallet);
    this.network = new Network(this.provider, this.wallet);
  }
}
