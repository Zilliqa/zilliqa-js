import {HTTPProvider, Provider} from '@zilliqa/zilliqa-js-core';
import {Wallet} from '@zilliqa/zilliqa-js-account';
import {Contracts} from '@zilliqa/zilliqa-js-contract';
import {Blockchain, Network} from '@zilliqa/zilliqa-js-blockchain';

export default class Zilliqa {
  provider: Provider;

  blockchain: Blockchain;
  contracts: Contracts;
  network: Network;
  wallet: Wallet;

  constructor(node: string, provider?: Provider) {
    // TODO: we need to perform duck typing here.
    if (provider) {
      this.provider = provider;
    } else {
      this.provider = new HTTPProvider(node);
    }

    this.wallet = new Wallet(this.provider);
    this.blockchain = new Blockchain(this.provider, this.wallet);
    this.network = new Network(this.provider, this.wallet);
    this.contracts = new Contracts(this.provider, this.wallet);
  }
}
