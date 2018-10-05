import BN from 'bn.js';
import {Wallet, Transaction} from 'zilliqa-js-account';
import {Provider, ZilliqaModule, format} from 'zilliqa-js-core';
import {ABI} from './types';

const enum ContractStatus {
  Deployed,
  Initialised,
}

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
  signer: Wallet;

  constructor(provider: Provider, signer: Wallet) {
    this.provider = provider;
    this.signer = signer;
    Contract.setProvider(this.provider);
  }

  at(
    address: string,
    abi: ABI,
    code: string,
    init?: any,
    state?: any,
  ): Contract {
    return new Contract(abi, address, code, init, state);
  }

  new(abi: ABI, code: string, init: any): Contract {
    return new Contract(abi, code, undefined, init);
  }
}

class Contract {
  static provider: Provider;
  static signer: Wallet;
  static setProvider(provider: Provider) {
    Contract.provider = provider;
  }

  abi: ABI;
  init: any;
  state: any;
  status: ContractStatus;

  address?: string;
  code?: string;

  constructor(
    abi: ABI,
    code: string,
    address?: string,
    init?: any,
    state?: any,
  ) {
    // assume that we are accessing an existing contract
    if (address && address.length) {
      // TODO: reject malformed address
      this.abi = abi;
      this.address = address;
      this.init = init;
      this.state = state;
      this.status = ContractStatus.Deployed;
    } else {
      // assume we're deploying
      // TODO
      this.abi = abi;
      this.code = code;
      this.status = ContractStatus.Initialised;
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

  call(transition: string, params: any) {}
}
