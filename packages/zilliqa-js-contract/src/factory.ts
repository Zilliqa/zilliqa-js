import hash from 'hash.js';

import { Wallet, Transaction, util } from '@zilliqa-js/account';
import { toChecksumAddress } from '@zilliqa-js/crypto';
import { Provider, RPCMethod, ZilliqaModule } from '@zilliqa-js/core';
import { bytes } from '@zilliqa-js/util';

import { Contract } from './contract';
import { ABI, Init, State } from './types';

/**
 * Contracts
 *
 * Unlike most zilliqa-js modules, `Contracts` is a factory class.
 * As a result, individual `Contract` instances are instead obtained by
 * calling `Contracts.at` (for an already-deployed contract) and
 * `Contracts.new` (to deploy a new contract).
 */
export class Contracts implements ZilliqaModule {
  /**
   * getAddressForContract
   *
   * @static
   * @param {Transaction} tx - transaction used to create the contract
   * @returns {string} - the contract address
   */
  static getAddressForContract(tx: Transaction): string {
    // always subtract 1 from the tx nonce, as contract addresses are computed
    // based on the nonce in the global state.
    const nonce = tx.txParams.nonce ? tx.txParams.nonce - 1 : 0;

    return toChecksumAddress(
      hash
        .sha256()
        .update(tx.senderAddress.replace('0x', '').toLowerCase(), 'hex')
        .update(bytes.intToHexArray(nonce, 16).join(''), 'hex')
        .digest('hex')
        .slice(24),
    );
  }

  provider: Provider;
  signer: Wallet;

  constructor(provider: Provider, signer: Wallet) {
    this.provider = provider;
    this.provider.middleware.request.use(
      util.formatOutgoingTx,
      RPCMethod.CreateTransaction,
    );
    this.signer = signer;
  }

  at(
    address: string,
    abi?: ABI,
    code?: string,
    init?: Init,
    state?: State,
  ): Contract {
    return new Contract(this, code, abi, address, init, state);
  }

  new(code: string, init: Init, abi?: ABI): Contract {
    return new Contract(this, code, abi, undefined, init);
  }
}
