import { Provider, RPCMethod, ZilliqaModule } from '@zilliqa-js/core';
import { Transaction } from './transaction';
import { TxParams, TxStatus } from './types';
import { formatOutgoingTx } from './util';
import { Wallet } from './wallet';

export class TransactionFactory implements ZilliqaModule {
  provider: Provider;
  signer: Wallet;

  constructor(provider: Provider, signer: Wallet) {
    this.provider = provider;
    this.provider.middleware.request.use(
      formatOutgoingTx,
      RPCMethod.CreateTransaction,
    );
    this.signer = signer;
  }

  new(txParams: TxParams, toDs: boolean = false) {
    return new Transaction(txParams, this.provider, TxStatus.Initialised, toDs);
  }
}
