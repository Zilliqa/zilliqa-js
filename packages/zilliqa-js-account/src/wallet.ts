import { Signer, Provider, RPCResponse } from '@zilliqa/zilliqa-js-core';
import * as zcrypto from '@zilliqa/zilliqa-js-crypto';

import Account from './account';
import Transaction from './transaction';

export default class Wallet extends Signer {
  accounts: { [address: string]: Account } = {};
  defaultAccount?: Account;
  provider: Provider;

  /**
   * constructor
   *
   * Takes an array of Account objects and instantiates a Wallet instance.
   *
   * @param {Account[]} accounts
   */
  constructor(provider: Provider, accounts: Account[] = []) {
    super();
    if (accounts.length) {
      this.accounts = accounts.reduce(
        (acc, account) => {
          return { ...acc, [account.address]: account };
        },
        {} as any,
      );
    }

    this.provider = provider;
    this.defaultAccount = accounts[0];
  }

  /**
   * create
   *
   * Creates a new keypair with a randomly-generated private key. The new
   * account is accessible by address.
   *
   * @returns {string} - address of the new account
   */
  create(): string {
    const privateKey = zcrypto.randomBytes(32);
    const newAccount = new Account(privateKey);

    this.accounts = { ...this.accounts, [newAccount.address]: newAccount };

    if (!this.defaultAccount) {
      this.defaultAccount = newAccount;
    }

    return newAccount.address;
  }

  /**
   * addByPrivateKey
   *
   * Adds an account to the wallet by private key.
   *
   * @param {string} privateKey
   * @returns {string}
   */
  addByPrivateKey(privateKey: string): string {
    const newAccount = new Account(privateKey);
    this.accounts = { ...this.accounts, [newAccount.address]: newAccount };

    if (!this.defaultAccount) {
      this.defaultAccount = newAccount;
    }

    return newAccount.address;
  }

  /**
   * addByKeystore
   *
   * Adds an account by keystore. This method is asynchronous and returns
   * a Promise<string>, in order not to block on the underlying decryption
   * operation.
   *
   * @param {string} keystore
   * @param {string} passphrase
   * @returns {Promise<string>}
   */
  async addByKeystore(keystore: string, passphrase: string): Promise<string> {
    const newAccount = await Account.fromFile(keystore, passphrase);
    this.accounts = { ...this.accounts, [newAccount.address]: newAccount };

    if (!this.defaultAccount) {
      this.defaultAccount = newAccount;
    }

    return newAccount.address;
  }

  /**
   * export
   *
   * Exports the specified account as a keystore file.
   *
   * @param {string} address
   * @param {string} passphrase
   * @param {KDF} kdf='scrypt'
   * @returns {Promise<string>}
   */
  export(address: string, passphrase: string, kdf: zcrypto.KDF = 'scrypt'): Promise<string> {
    if (!this.accounts[address]) {
      throw new Error(`No account with address ${address} exists`);
    }

    return this.accounts[address].toFile(passphrase, kdf);
  }

  /**
   * remove
   *
   * Removes an account from the wallet and returns boolean to indicate
   * failure or success.
   *
   * @param {string} address
   * @returns {boolean}
   */
  remove(address: string): boolean {
    if (this.accounts[address]) {
      const { [address]: toRemove, ...rest } = this.accounts;

      this.accounts = rest;
      return true;
    }

    return false;
  }

  /**
   * setDefault
   *
   * Sets the default account of the wallet.
   *
   * @param {string} address
   */
  setDefault(address: string) {
    this.defaultAccount = this.accounts[address];
  }

  /**
   * sign
   *
   * signs an unsigned transaction with the default account.
   *
   * @param {Transaction} tx
   * @param {string} account
   * @returns {Transaction}
   */
  sign(tx: Transaction): Promise<Transaction> {
    if (!this.defaultAccount) {
      throw new Error('This wallet has no default account.');
    }

    return this.signWith(tx, this.defaultAccount.address);
  }

  /**
   * signWith
   *
   * @param {Transaction} tx
   * @param {string} account
   * @returns {Transaction}
   */
  async signWith(tx: Transaction, account: string): Promise<Transaction> {
    if (!this.accounts[account]) {
      throw new Error('The selected account does not exist on this Wallet instance.');
    }

    try {
      const signer = this.accounts[account];
      const balance = await this.provider.send('GetBalance', signer.address);

      if (typeof balance.result.nonce !== 'number') {
        throw new Error('Could not get nonce');
      }

      const withNonce = tx.map((txObj) => {
        return {
          ...txObj,
          nonce: balance.result.nonce + 1,
          pubKey: signer.publicKey,
        };
      });

      return withNonce.map((txObj) => {
        // @ts-ignore
        return {
          ...txObj,
          signature: signer.signTransaction(withNonce.bytes),
        };
      });
    } catch (err) {
      throw err;
    }
  }
}
