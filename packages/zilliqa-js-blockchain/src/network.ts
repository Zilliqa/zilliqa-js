import {Provider, ZilliqaModule} from '@zilliqa/zilliqa-js-core';
import {Wallet} from '@zilliqa/zilliqa-js-account';

const enum NetworkMethods {
  GetClientVersion = 'GetClientVersion',
  GetNetworkId = 'GetNetworkId',
  GetProtocolVersion = 'GetProtocolVersion',
}

export default class Network implements ZilliqaModule {
  provider: Provider;
  signer: Wallet;

  constructor(provider: Provider, signer: Wallet) {
    this.provider = provider;
    this.signer = signer;
  }

  getClientVersion(): Promise<any> {
    return this.provider.send(NetworkMethods.GetClientVersion);
  }

  GetNetworkId(): Promise<any> {
    return this.provider.send(NetworkMethods.GetNetworkId);
  }

  GetProtocolVersion(blockNum: number): Promise<any> {
    return this.provider.send(NetworkMethods.GetProtocolVersion);
  }
}
