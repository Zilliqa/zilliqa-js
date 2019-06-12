import { Provider } from '@zilliqa-js/core';
import { hash } from '@zilliqa-js/crypto';
import { Transaction } from './transaction';
import { Wallet } from './wallet';
import { TransactionFactory } from './transactionFactory';

export type TxnMap = Map<string, Transaction>;

export class TransactionPool extends TransactionFactory {
  signedPool: TxnMap;
  pendingPool: TxnMap;
  confirmedPool: TxnMap;
  rejectedPool: TxnMap;
  constructor(provider: Provider, signer: Wallet) {
    super(provider, signer);
    this.signedPool = new Map();
    this.pendingPool = new Map();
    this.confirmedPool = new Map();
    this.rejectedPool = new Map();
  }

  async sign(txn: Transaction): Promise<Transaction> {
    try {
      const signed = await this.signer.sign(txn);
      this.pushSigned(signed);
      return signed;
    } catch (error) {
      throw error;
    }
  }

  async send(txn: Transaction): Promise<Transaction> {
    try {
      const [sent, TranID] = await txn.sendTransaction();
      if (this.signedPool.has(TranID)) {
        this.signedPool.delete(TranID);
      }
      this.pendingPool.set(TranID, sent);
      return sent;
    } catch (error) {
      throw error;
    }
  }

  confirmPending() {
    const txnIds = [...this.pendingPool.keys()];
    return Promise.race(
      txnIds.map((TranID) => {
        return new Promise((resolve, reject) => {
          const txn = this.pendingPool.get(TranID);
          if (txn) {
            this.confirmOne(txn, TranID).then((result: Transaction) => {
              if (result.isConfirmed()) {
                this.confirmedPool.set(TranID, result);
                this.pendingPool.delete(TranID);
              }
              if (result.isRejected()) {
                this.rejectedPool.set(TranID, result);
                this.pendingPool.delete(TranID);
              }
              resolve(result);
            });
          }
        });
      }),
    );
  }

  confirmOne(txn: Transaction, TranID: string) {
    try {
      txn.blockConfirm(TranID, 20, 1000).then(() => {
        txn.emitter.resolve(txn);
      });
      return txn.emitter;
    } catch (error) {
      throw error;
    }
  }

  private pushSigned(txn: Transaction): void {
    const TranID = this.getTransactionId(txn.bytes);
    this.signedPool.set(TranID, txn);
  }

  private getTransactionId(bytes: Buffer): string {
    return hash
      .sha256()
      .update(bytes.toString('hex'), 'hex')
      .digest('hex');
  }
}
