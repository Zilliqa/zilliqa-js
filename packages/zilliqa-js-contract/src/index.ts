import BN from 'bn.js';
import * as zaccount from 'zilliqa-js-account';
import {Provider, ZilliqaModule, format} from 'zilliqa-js-core';
import {ABI} from './types';

/**
 * Contracts
 *
 * Unlike most zilliqa-js modules, `Contracts` is a factory class.
 * As a result, individual `Contract` instances are instead obtained by
 * calling `Contracts.at` (for an already-deployed contract) and
 * `Contracts.new` (to deploy a new contract).
 */
export class Contracts implements ZilliqaModule {
  provider: Provider;
  signer: zaccount.Wallet;

  constructor(provider: Provider, signer: zaccount.Wallet) {
    this.provider = provider;
    this.signer = signer;
    Contract.setProvider(this.provider);
  }

  at(abi: ABI, address: string): Contract {
    return new Contract(abi, address);
  }

  new(abi: ABI, code: string): Contract {
    return new Contract(abi, undefined, code);
  }
}

class Contract {
  static provider: Provider;
  static setProvider(provider: Provider) {
    Contract.provider = provider;
  }

  abi: ABI;
  address?: string;
  code?: string;
  isDeployed: boolean = false;

  constructor(abi: ABI, address?: string, code?: string) {
    // assume that we are accessing an existing contract
    if (address && address.length) {
      // TODO: reject malformed address
      this.abi = abi;
      this.address = address;
      this.isDeployed = true;
    } else {
      // assume we're deploying
      // TODO
      this.abi = abi;
      this.code = code;
      this.isDeployed = false;
    }
  }

  buildDeploymentPayload(opt: any) {
    return {
      version: 1,
      nonce: 1,
      to: '0x00000000000000000000',
      amount: '0',
      pubKey: '',
      gasPrice: '',
      gasLimit: '',
      code: opt.code,
    };
  }

  deploy(gasPrice: BN, gasLimit: BN): Promise<any> {
    return Contract.provider.send('CreateTransaction', {});
  }

  @format((x: any) => x, (x: number) => x.toString())
  on(event: string, subscriber: any): number {
    return 1;
  }

  call(transition: string, params: any) {}
}
